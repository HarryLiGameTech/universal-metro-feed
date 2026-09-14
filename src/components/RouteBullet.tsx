import { routes } from "../data/stations.generated";

interface RouteBulletProps {
  routeId: string;
  size?: "small" | "large";
}

export function RouteBullet({ routeId, size = "small" }: RouteBulletProps) {
  const route = routes[routeId as keyof typeof routes];

  return (
    <span
      className={`route-bullet route-bullet--${size}`}
      style={{
        backgroundColor: route?.color ?? "#555",
        color: route?.textColor ?? "#fff",
      }}
      aria-label={`${routeId} train`}
    >
      {routeId}
    </span>
  );
}
