import { InputBlock } from '@/app/types';
import { getAllPlugins } from './getAllPlugins';

/**
 * Fetches all input blocks from all plugins
 * @returns Array of input blocks
 */
export async function getAllInputBlocks(): Promise<InputBlock[]> {
  try {
    const plugins = await getAllPlugins();
    
    // Extract all input blocks from all plugins
    let allInputBlocks: InputBlock[] = [];
    
    for (const plugin of plugins) {
      if (plugin.input_blocks && Array.isArray(plugin.input_blocks) && plugin.input_blocks.length > 0) {
        // Cast the input blocks to the correct type
        const inputBlocks = plugin.input_blocks as unknown as InputBlock[];
        allInputBlocks = [...allInputBlocks, ...inputBlocks];
      }
    }
    
    return allInputBlocks;
  } catch (error) {
    console.error('Error fetching all input blocks:', error);
    return [];
  }
} 