"use client";

import { useEffect } from "react";
import { getTheme, applyTheme } from "@/lib/utils/theme";

export default function ThemeProvider() {
  useEffect(() => {
    // 초기 로드 시 테마 적용
    const theme = getTheme();
    applyTheme(theme);
  }, []);

  return null;
}



