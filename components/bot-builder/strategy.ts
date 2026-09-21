import type * as Blockly from 'blockly';

export type BotContractType =
  | 'CALL'
  | 'PUT'
  | 'DIGITMATCH'
  | 'DIGITDIFF'
  | 'DIGITOVER'
  | 'DIGITUNDER'
  | 'DIGITEVEN'
  | 'DIGITODD';

export interface BotStrategy {
  symbol: string;
  stake: number;
  duration: number;
  contractType: BotContractType;
  barrier?: number;
}

export interface StrategyValidation {
  valid: boolean;
  errors: string[];
}

export function parseWorkspaceStrategy(workspace: Blockly.Workspace): BotStrategy | null {
  const blocks = workspace.getAllBlocks(false);
  const symbolBlock = blocks.find(block => block.type === 'deriv_set_symbol');
  const stakeBlock = blocks.find(block => block.type === 'deriv_set_stake');
  const durationBlock = blocks.find(block => block.type === 'deriv_set_duration');
  const contractBlock = blocks.find(
    block => block.type === 'deriv_rise_fall' || block.type === 'deriv_digit_contract'
  );

  if (!symbolBlock || !stakeBlock || !durationBlock || !contractBlock) return null;

  const symbol = symbolBlock.getFieldValue('SYMBOL')?.trim();
  const stake = Number(stakeBlock.getFieldValue('STAKE'));
  const duration = Number(durationBlock.getFieldValue('DURATION'));
  const contractType = contractBlock.getFieldValue('CONTRACT') as BotContractType;

  let barrier: number | undefined;
  if (contractBlock.type === 'deriv_digit_contract') {
    const input = contractBlock.getInput('BARRIER');
    const connected = input?.connection?.targetBlock();
    if (connected?.type === 'math_number') {
      barrier = Number(connected.getFieldValue('NUM'));
    } else {
      const field = contractBlock.getFieldValue('BARRIER');
      if (field !== null && field !== undefined && field !== '') barrier = Number(field);
    }
  }

  return { symbol, stake, duration, contractType, ...(barrier !== undefined ? { barrier } : {}) };
}

export function validateStrategy(strategy: BotStrategy | null): StrategyValidation {
  const errors: string[] = [];
  if (!strategy) return { valid: false, errors: ['Add symbol, stake, duration and a contract block.'] };
  if (!strategy.symbol) errors.push('Symbol is required.');
  if (!Number.isFinite(strategy.stake) || strategy.stake <= 0) errors.push('Stake must be greater than 0.');
  if (!Number.isInteger(strategy.duration) || strategy.duration < 1) errors.push('Duration must be at least 1 tick.');
  if (!['CALL','PUT','DIGITMATCH','DIGITDIFF','DIGITOVER','DIGITUNDER','DIGITEVEN','DIGITODD'].includes(strategy.contractType)) {
    errors.push('Unsupported contract type.');
  }
  if (['DIGITMATCH','DIGITDIFF','DIGITOVER','DIGITUNDER'].includes(strategy.contractType)) {
    if (strategy.barrier === undefined || !Number.isInteger(strategy.barrier) || strategy.barrier < 0 || strategy.barrier > 9) {
      errors.push('Digit contracts require a barrier from 0 to 9.');
    }
  }
  return { valid: errors.length === 0, errors };
}
