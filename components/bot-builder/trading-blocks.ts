import * as Blockly from 'blockly';

export const DERIV_BLOCK_TYPES = ['deriv_trade_definition','deriv_set_symbol','deriv_set_stake','deriv_set_duration','deriv_rise_fall','deriv_digit_contract','deriv_purchase','deriv_condition'];

export function registerTradingBlocks() {
  if (Blockly.Blocks['deriv_trade_definition']) return;
  Blockly.Blocks['deriv_trade_definition'] = { init() { this.appendDummyInput().appendField('Deriv Trade'); this.appendStatementInput('OPTIONS').appendField('Options'); this.setColour(210); } };
  Blockly.Blocks['deriv_set_symbol'] = { init() { this.appendDummyInput().appendField('Symbol').appendField(new Blockly.FieldTextInput('R_100'), 'SYMBOL'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(210); } };
  Blockly.Blocks['deriv_set_stake'] = { init() { this.appendDummyInput().appendField('Stake').appendField(new Blockly.FieldNumber(1, 0.35), 'STAKE'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(230); } };
  Blockly.Blocks['deriv_set_duration'] = { init() { this.appendDummyInput().appendField('Duration').appendField(new Blockly.FieldNumber(1, 1), 'DURATION').appendField('ticks'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(230); } };
  Blockly.Blocks['deriv_rise_fall'] = { init() { this.appendDummyInput().appendField('Trade').appendField(new Blockly.FieldDropdown([['Rise','CALL'],['Fall','PUT']]), 'CONTRACT'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(20); } };
  Blockly.Blocks['deriv_digit_contract'] = { init() { this.appendDummyInput().appendField('Digit').appendField(new Blockly.FieldDropdown([['Matches','DIGITMATCH'],['Differs','DIGITDIFF'],['Over','DIGITOVER'],['Under','DIGITUNDER'],['Even','DIGITEVEN'],['Odd','DIGITODD']]), 'CONTRACT'); this.appendValueInput('BARRIER').setCheck('Number').appendField('barrier'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(20); } };
  Blockly.Blocks['deriv_purchase'] = { init() { this.appendDummyInput().appendField('Purchase contract'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(120); } };
  Blockly.Blocks['deriv_condition'] = { init() { this.appendValueInput('LEFT').setCheck('Number').appendField('Price'); this.appendDummyInput().appendField(new Blockly.FieldDropdown([['>','GT'],['<','LT'],['=','EQ']]), 'OP'); this.appendValueInput('RIGHT').setCheck('Number'); this.setOutput(true, 'Boolean'); this.setColour(210); } };
}
