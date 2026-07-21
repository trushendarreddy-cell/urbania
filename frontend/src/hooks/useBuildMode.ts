import { useState } from "react";
import type { BuildMode } from "../types/game";

export default function useBuildMode() {
  const [buildMode, setBuildMode] =
    useState<BuildMode>("none");

  return {
    buildMode,
    setBuildMode,
  }
}