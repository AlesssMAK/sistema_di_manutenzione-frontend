export function createOptionMapper<T extends string>(
  options: { value: T; label: string }[]
) {
  const labelsArray = options.map(item => item.label);

  const getValueByLabel = (label: string): T | undefined => {
    return options.find(item => item.label === label)?.value;
  };

  const getLabelByValue = (value: T): string | undefined => {
    return options.find(item => item.value === value)?.label;
  };

  return {
    labelsArray,
    getValueByLabel,
    getLabelByValue,
  };
}
