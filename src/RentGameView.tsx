// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { Button, Text } from "@rneui/themed";
import { randItem } from "./randItem.js";
import { randInt } from "./randInt.js";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const HouseView = ({
  house: { id, brokenItem, value, owner, tenant },
  onFix,
  onEvict,
  onLet,
  onBuy,
  onSell,
}: {
  house: House;
  onFix?: () => unknown;
  onEvict?: () => unknown;
  onLet?: () => unknown;
  onBuy?: () => unknown;
  onSell?: () => unknown;
}) => (
  <View style={styles.house}>
    <Svg height="100" width="100">
      <Rect
        x="10"
        y="10"
        width="80"
        height="80"
        stroke="black"
        strokeWidth="2"
        fill="lightgrey"
      />
      {brokenItem && (
        <AnimatedRect
          animatedProps={useAnimatedProps(() => ({
            opacity: brokenItem
              ? withTiming(1, { duration: 1000 })
              : withTiming(0, { duration: 1000 }),
          }))}
          x="30"
          y="30"
          width="40"
          height="40"
          stroke="red"
          strokeWidth="2"
          fill="none"
        />
      )}
    </Svg>
    <Text>House {id}</Text>
    {owner ? (
      <>
        {brokenItem ? <Text>{`${brokenItem} is broken`}</Text> : null}
        {tenant ? (
          <Text>{!brokenItem ? "Tenant is happy" : "Tenant is upset"}</Text>
        ) : null}
      </>
    ) : null}
    <Text>Value: ${value}</Text>
    {owner ? (
      <>
        {brokenItem ? <Button title="Call Contractor" onPress={onFix} /> : null}
        {tenant ? <Button title="Evict Tenant" onPress={onEvict} /> : null}
      </>
    ) : null}
    {onLet ? <Button title={"Let"} onPress={onLet} /> : null}
    {onSell ? <Button title={"Sell"} onPress={onSell} /> : null}
    {onBuy ? <Button title={"Buy"} onPress={onBuy} /> : null}
  </View>
);

const elements = ["geyser", "window", "toilet", "septic-tank", "gate"];

type House = {
  id: number;
  brokenItem: (typeof elements)[number] | null;
  value: number;
  owner: boolean;
  tenant: { damage: number } | null;
};

const randHouseId = () => randInt(900) + 100;
const randomHouse = () => ({
  id: randHouseId(),
  brokenItem: null,
  value: randInt(10000) + 10000,
  owner: false,
  tenant: randInt(3) ? randomTenant() : null,
});
const randomTenant = () => ({
  damage: randInt(4),
});

export const RentGameView = () => {
  const [houses, setHouses] = useState<House[]>(
    Array.from({ length: 4 }).map(randomHouse)
  );
  const [rating, setRating] = useState(0);
  const [money, setMoney] = useState(50000);

  useEffect(() => {
    const interval = setInterval(() => {
      setHouses((prevHouses) =>
        prevHouses.map((house) => {
          if (!house.brokenItem && Math.random() < 0.3) {
            return {
              ...house,
              brokenItem: randItem(elements) ?? null,
            };
          }
          return house;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleFix = (id: number) => {
    const house = houses.find((h) => h.id === id);
    const cost = randInt(10) * 100 + 100;
    if (house?.brokenItem && cost <= money) {
      setHouses((prevHouses) =>
        prevHouses.map((house) => {
          if (house.id === id && house.brokenItem) {
            return { ...house, brokenItem: null };
          }
          return house;
        })
      );
      setRating((prevRating) => prevRating + 1);
      setMoney((prevMoney) => prevMoney - cost);
    }
  };

  const handleEvict = (id: number) => {
    const house = houses.find((h) => h.id === id);
    if (house?.tenant) {
      setHouses((prevHouses) =>
        prevHouses.map((house) =>
          house.id === id ? { ...house, tenant: null } : house
        )
      );
      setRating((prevRating) => prevRating - 1);
    }
  };
  const handleLet = (id: number) => {
    const house = houses.find((h) => h.id === id);
    if (house && !house?.tenant) {
      setHouses((prevHouses) =>
        prevHouses.map((house) =>
          house.id === id ? { ...house, tenant: randomTenant() } : house
        )
      );
    }
  };

  const handleBuyHouse = (id: number) => {
    const house = houses.find((h) => h.id === id);
    if (house && money >= house.value) {
      setHouses((prevHouses) =>
        prevHouses.map((h) => (h.id === id ? { ...h, owner: true } : h))
      );
      setMoney((prevMoney) => prevMoney - house.value);
    }
  };

  const handleSellHouse = (id: number) => {
    const house = houses.find((h) => h.id === id);
    if (house) {
      setHouses((prevHouses) =>
        prevHouses.map((h) => (h.id === id ? { ...h, owner: false } : h))
      );
      setMoney((prevMoney) => prevMoney + house.value);
    }
  };

  const breakRandItemInHouses = (prevHouses: House[]) =>
    prevHouses.map((house) => {
      if (house.tenant && Math.random() < house.tenant.damage / 10) {
        return { ...house, brokenItem: randItem(elements) ?? null };
      }
      return house;
    });

  useEffect(() => {
    const interval = setInterval(() => {
      setHouses(breakRandItemInHouses);
    }, 10000);

    return () => clearInterval(interval);
  }, [houses]);

  const collectRent = (prevMoney: number) =>
    prevMoney +
    houses.reduce(
      (total, house) =>
        total +
        (house.tenant
          ? !house.brokenItem
            ? house.value * (1 + rating / 10)
            : house.value
          : 0),
      0
    );

  const makeUpsetTenantsLeave = (houses: House[]): House[] =>
    houses.map((house) =>
      house.tenant && house.brokenItem ? { ...house, tenant: null } : house
    );

  useEffect(() => {
    const interval = setInterval(() => {
      setMoney(collectRent);
      setHouses(makeUpsetTenantsLeave);
    }, 10000);

    return () => clearInterval(interval);
  }, [houses, rating]);

  const addRandomHouses = (prevHouses: House[]): House[] => [
    ...prevHouses.filter((h) => (h.owner ? true : randInt(3) > 0)),
    randomHouse(),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHouses(addRandomHouses);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Rating: {rating}</Text>
      <Text>Money: ${money}</Text>
      <View style={styles.housesContainer}>
        {houses.map((house) => (
          <HouseView
            key={house.id}
            house={house}
            onFix={() => handleFix(house.id)}
            onEvict={() => handleEvict(house.id)}
            onLet={
              house.owner && !house.tenant
                ? () => handleLet(house.id)
                : undefined
            }
            onBuy={
              !house.owner && house.value <= money
                ? () => handleBuyHouse(house.id)
                : undefined
            }
            onSell={house.owner ? () => handleSellHouse(house.id) : undefined}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  housesContainer: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  house: {
    width: 150,
    margin: 10,
    alignItems: "center",
  },
});
