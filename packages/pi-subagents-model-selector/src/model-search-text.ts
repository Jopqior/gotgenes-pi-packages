/**
 * model-search-text.ts — Haystack for the spawn form's model filter.
 *
 * Copied from Pi 0.84.4 `getModelSelectorSearchText`, which is not a public
 * SDK export. The bare model id is kept out of the leading position so a
 * provider-prefixed query ranks before proxy-provider ids.
 */

export interface ModelSearchItem {
  readonly id: string;
  readonly provider: string;
  readonly name?: string;
}

export function getModelSelectorSearchText(item: ModelSearchItem): string {
  const { id, provider } = item;
  const name = item.name ? ` ${item.name}` : "";
  return `${provider} ${provider}/${id} ${provider} ${id}${name}`;
}
