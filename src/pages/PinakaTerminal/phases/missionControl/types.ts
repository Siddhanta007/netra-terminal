// Trade-card domain types for the Mission Control (Trading Data / P7) phase.

export interface AddEntry    { id: number; price: number; stop: number; qty: number; cost: number; time: string; }
export interface PartialExit { id: number; qty: number; price: number; time: string; }

/**
 * One planned / executed trade. A trading day holds an array of these in
 * localStorage; each is also mirrored to the backend `quick-trade` record.
 */
export interface TradeCard {
  id: string;
  date: string;
  dbId: string | null;
  side: 'BUY' | 'SELL';
  weapon: string;        // entry-model id this trade was fired under (or 'MANUAL')
  weaponThought: string; // trader's read, written BEFORE asking Maya for a model
  weaponNote: string;    // custom entry strategy when weapon = MANUAL
  assetSuffix: string;
  entry: string; sl: string; slManual: boolean;
  qty: string; cost: string;
  t1: string; t2: string; t3: string; t4: string;
  addEntries: AddEntry[];
  partialExits: PartialExit[];
  beTriggered: boolean;
  notes: string;
  exitPrice: string;
  entryTime: string;
  exitTime: string;
  closed: boolean;
  tradeStatus: string;
  exitType: string;
}
