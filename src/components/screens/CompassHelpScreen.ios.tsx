import { CompassHelpBody } from "@/components/CompassHelpBody";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function CompassHelpScreen() {
  useMarkInteractive();
  return <CompassHelpBody />;
}
