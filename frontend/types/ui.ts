// Type untuk container view modal (dialog atau sidebar)
export type ContainerType = "dialog" | "sidebar";
 
// Props untuk container
export interface ContainerProps {
  containerType?: ContainerType;
} 