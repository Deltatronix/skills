export interface Purchase {
  category: string;
  amount: number;
  unitPrice: number;
}

export interface Store {
  categories: string[];
  rows: Purchase[];
}

export function createStore(categories: string[] = []): Store {
  return { categories: [...categories], rows: [] };
}
