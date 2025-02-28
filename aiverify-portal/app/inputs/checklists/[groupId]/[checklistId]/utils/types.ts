export interface MDXProps {
  data: Record<string, string>;
  onChangeData: (key: string, value: string) => void;
}
