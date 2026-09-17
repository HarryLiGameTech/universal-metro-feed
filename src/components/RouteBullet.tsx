import { useCatalog } from "../providers/catalog-context";

interface RouteBulletProps {
  routeId: string;
  size?: "small" | "large";
}

export function RouteBullet({ routeId, size = "small" }: RouteBulletProps) {
  const { routes } = useCatalog();
  const route = routes[routeId];

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
