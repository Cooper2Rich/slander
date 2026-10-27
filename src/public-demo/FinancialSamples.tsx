import { browserStorage } from "./storage";
import { useEffect, useState } from "react";

const key = "slander-financial-samples-v1";
const event = "slander-financial-samples-changed";
export function useFinancialSamples() {
  const read = () => browserStorage.getItem(key) !== "hidden";
  const [enabled, setEnabled] = useState(read);
  useEffect(() => {
    const update = () => setEnabled(read());
    window.addEventListener(event, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(event, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return {
    enabled,
    setEnabled(value: boolean) {
      browserStorage.setItem(key, value ? "shown" : "hidden");
      window.dispatchEvent(new Event(event));
    },
  };
}
export function FinancialSampleControl() {
  const { enabled, setEnabled } = useFinancialSamples();
  return (
    <div className="financial-sample-control">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Include sample activity
      </label>
      <span>
        {enabled
          ? "Fictional earnings and payments + saved contributions. No real transfers."
          : "Saved contributions only · no completed payments."}
      </span>
    </div>
  );
}
