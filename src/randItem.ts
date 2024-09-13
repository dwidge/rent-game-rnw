// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { randInt } from "./randInt.js";

export const randItem = (items: string[]) => items[randInt(items.length)];
