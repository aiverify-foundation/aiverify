// from D3 Category10
export const Colors = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"];

export const getColor = (index: number): string => {
  return Colors[index % Colors.length]
}