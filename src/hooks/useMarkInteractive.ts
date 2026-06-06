import { useEffect } from "react";
import { useObserve } from "expo-observe";

export function useMarkInteractive() {
  const { markInteractive } = useObserve();
  useEffect(() => {
    markInteractive();
  }, [markInteractive]);
}
