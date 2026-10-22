import { Converter } from "opencc-js";

// Convert presentation only. Upstream keys and calculations keep their original spelling.
export const traditional = Converter({ from: "cn", to: "twp" });
export const BRANCH_LABELS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const STEM_LABELS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
