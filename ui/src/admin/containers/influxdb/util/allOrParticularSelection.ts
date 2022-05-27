/**
 * AllOrParticularSelection function ensures that when all ('*') option is selected,
 * particular options are de-selected, and when a particular option is selected '*'
 * option is deselected.
 */
export default function allOrParticularSelection(
  oldVals: string[],
  newVals: string[]
): string[] {
  if (newVals.length <= 1) {
    // empty or simpgle selection is always OK
    return newVals
  }
  const isAll = newVals.includes('*')
  const wasAll = oldVals.includes('*')
  if (wasAll && isAll) {
    // more than one value is selected, remove <ALL> option
    return newVals.filter(x => x !== '*')
  }
  if (!wasAll && isAll) {
    // <ALL> option is selected, keep only the <ALL> option
    return ['*']
  }
  return newVals
}
