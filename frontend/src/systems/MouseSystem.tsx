import { useEffect } from "react";

export default function MouseSystem() {
  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      console.log(
        `Mouse: (${event.clientX}, ${event.clientY})`
      );
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}