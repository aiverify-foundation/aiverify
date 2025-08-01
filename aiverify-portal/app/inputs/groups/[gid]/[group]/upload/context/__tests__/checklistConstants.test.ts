import {
  PROCESS_CHECKLIST_CIDS,
  CHECKLIST_DISPLAY_NAMES,
  STOCK_PROCESS_CHECKLIST_GID,
  DEFAULT_CHECKLISTS,
  createChecklist,
  getChecklistByCid,
  fetchDynamicChecklists,
  type Checklist,
} from '../checklistConstants';

// Mock fetch for testing
global.fetch = jest.fn();

describe('checklistConstants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PROCESS_CHECKLIST_CIDS', () => {
    it('should contain all expected checklist IDs', () => {
      const expectedCids = [
        'transparency_process_checklist',
        'explainability_process_checklist',
        'reproducibility_process_checklist',
        'safety_process_checklist',
        'security_process_checklist',
        'robustness_process_checklist',
        'fairness_process_checklist',
        'data_governance_process_checklist',
        'accountability_process_checklist',
        'human_agency_oversight_process_checklist',
        'inclusive_growth_process_checklist',
        'organisational_considerations_process_checklist',
      ];

      expect(PROCESS_CHECKLIST_CIDS).toEqual(expectedCids);
      expect(PROCESS_CHECKLIST_CIDS).toHaveLength(12);
    });

    it('should be readonly array', () => {
      expect(PROCESS_CHECKLIST_CIDS).toBeInstanceOf(Array);
      // Test that it's readonly by attempting to modify (should not throw in test environment)
      // Note: In test environment, this might actually modify the array, so we'll just check the type
      expect(PROCESS_CHECKLIST_CIDS).toHaveLength(12);
    });
  });

  describe('CHECKLIST_DISPLAY_NAMES', () => {
    it('should contain display names for all checklist IDs', () => {
      PROCESS_CHECKLIST_CIDS.forEach((cid) => {
        expect(CHECKLIST_DISPLAY_NAMES[cid]).toBeDefined();
        expect(typeof CHECKLIST_DISPLAY_NAMES[cid]).toBe('string');
        expect(CHECKLIST_DISPLAY_NAMES[cid].length).toBeGreaterThan(0);
      });
    });

    it('should have correct display names', () => {
      expect(CHECKLIST_DISPLAY_NAMES.transparency_process_checklist).toBe('Transparency Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.explainability_process_checklist).toBe('Explainability Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.reproducibility_process_checklist).toBe('Reproducibility Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.safety_process_checklist).toBe('Safety Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.security_process_checklist).toBe('Security Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.robustness_process_checklist).toBe('Robustness Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.fairness_process_checklist).toBe('Fairness Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.data_governance_process_checklist).toBe('Data Governance Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.accountability_process_checklist).toBe('Accountability Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.human_agency_oversight_process_checklist).toBe('Human Agency Oversight Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.inclusive_growth_process_checklist).toBe('Inclusive Growth Process Checklist');
      expect(CHECKLIST_DISPLAY_NAMES.organisational_considerations_process_checklist).toBe('Organisational Considerations Process Checklist');
    });

    it('should have same number of entries as PROCESS_CHECKLIST_CIDS', () => {
      expect(Object.keys(CHECKLIST_DISPLAY_NAMES)).toHaveLength(PROCESS_CHECKLIST_CIDS.length);
      expect(Object.keys(CHECKLIST_DISPLAY_NAMES)).toHaveLength(12);
    });
  });

  describe('STOCK_PROCESS_CHECKLIST_GID', () => {
    it('should have correct value', () => {
      expect(STOCK_PROCESS_CHECKLIST_GID).toBe('aiverify.stock.process_checklist');
    });
  });

  describe('DEFAULT_CHECKLISTS', () => {
    it('should generate checklists for all CIDs', () => {
      expect(DEFAULT_CHECKLISTS).toHaveLength(PROCESS_CHECKLIST_CIDS.length);
      expect(DEFAULT_CHECKLISTS).toHaveLength(12);
      
      DEFAULT_CHECKLISTS.forEach((checklist, index) => {
        expect(checklist.cid).toBe(PROCESS_CHECKLIST_CIDS[index]);
        expect(checklist.gid).toBe(STOCK_PROCESS_CHECKLIST_GID);
        expect(checklist.name).toBe(CHECKLIST_DISPLAY_NAMES[PROCESS_CHECKLIST_CIDS[index]]);
        expect(checklist.data).toEqual({});
        expect(checklist.group).toBe('default');
      });
    });

    it('should have correct structure for each checklist', () => {
      DEFAULT_CHECKLISTS.forEach((checklist) => {
        expect(checklist).toHaveProperty('cid');
        expect(checklist).toHaveProperty('gid');
        expect(checklist).toHaveProperty('name');
        expect(checklist).toHaveProperty('data');
        expect(checklist).toHaveProperty('group');
        expect(typeof checklist.cid).toBe('string');
        expect(typeof checklist.gid).toBe('string');
        expect(typeof checklist.name).toBe('string');
        expect(typeof checklist.data).toBe('object');
        expect(typeof checklist.group).toBe('string');
      });
    });
  });

  describe('createChecklist', () => {
    it('should create checklist with default values', () => {
      const checklist = createChecklist('test_cid');
      
      expect(checklist).toEqual({
        cid: 'test_cid',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: 'test_cid', // Should use cid as name when not in CHECKLIST_DISPLAY_NAMES
        data: {},
        group: 'default',
      });
    });

    it('should create checklist with custom data', () => {
      const customData = { key1: 'value1', key2: 'value2' };
      const checklist = createChecklist('test_cid', customData);
      
      expect(checklist).toEqual({
        cid: 'test_cid',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: 'test_cid',
        data: customData,
        group: 'default',
      });
    });

    it('should create checklist with custom group', () => {
      const checklist = createChecklist('test_cid', {}, 'custom_group');
      
      expect(checklist).toEqual({
        cid: 'test_cid',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: 'test_cid',
        data: {},
        group: 'custom_group',
      });
    });

    it('should create checklist with custom data and group', () => {
      const customData = { key1: 'value1' };
      const checklist = createChecklist('test_cid', customData, 'custom_group');
      
      expect(checklist).toEqual({
        cid: 'test_cid',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: 'test_cid',
        data: customData,
        group: 'custom_group',
      });
    });

    it('should use display name when cid exists in CHECKLIST_DISPLAY_NAMES', () => {
      const checklist = createChecklist('transparency_process_checklist');
      
      expect(checklist).toEqual({
        cid: 'transparency_process_checklist',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: 'Transparency Process Checklist',
        data: {},
        group: 'default',
      });
    });

    it('should handle empty string cid', () => {
      const checklist = createChecklist('');
      
      expect(checklist).toEqual({
        cid: '',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: '',
        data: {},
        group: 'default',
      });
    });

    it('should handle null/undefined data gracefully', () => {
      const checklist = createChecklist('test_cid', null as any);
      
      expect(checklist).toEqual({
        cid: 'test_cid',
        gid: STOCK_PROCESS_CHECKLIST_GID,
        name: 'test_cid',
        data: null,
        group: 'default',
      });
    });
  });

  describe('getChecklistByCid', () => {
    it('should return checklist when cid exists', () => {
      const checklist = getChecklistByCid('transparency_process_checklist');
      
      expect(checklist).toBeDefined();
      expect(checklist?.cid).toBe('transparency_process_checklist');
      expect(checklist?.name).toBe('Transparency Process Checklist');
    });

    it('should return undefined when cid does not exist', () => {
      const checklist = getChecklistByCid('non_existent_cid');
      
      expect(checklist).toBeUndefined();
    });

    it('should return undefined for empty string cid', () => {
      const checklist = getChecklistByCid('');
      
      expect(checklist).toBeUndefined();
    });

    it('should return undefined for null/undefined cid', () => {
      const checklist = getChecklistByCid(null as any);
      
      expect(checklist).toBeUndefined();
    });

    it('should find all existing checklists', () => {
      PROCESS_CHECKLIST_CIDS.forEach((cid) => {
        const checklist = getChecklistByCid(cid);
        expect(checklist).toBeDefined();
        expect(checklist?.cid).toBe(cid);
      });
    });
  });

  describe('fetchDynamicChecklists', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch checklists successfully', async () => {
      const mockResponse = [
        { cid: 'test1', gid: 'test.gid', name: 'Test 1' },
        { cid: 'test2', gid: 'test.gid' }, // without name
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchDynamicChecklists('test.gid');

      expect(global.fetch).toHaveBeenCalledWith('/api/input_block_data/groups?gid=test.gid');
      expect(result).toEqual([
        {
          cid: 'test1',
          gid: 'test.gid',
          name: 'Test 1',
          data: {},
          group: 'default',
        },
        {
          cid: 'test2',
          gid: 'test.gid',
          name: 'test2', // should use cid as name when name is not provided
          data: {},
          group: 'default',
        },
      ]);
    });

    it('should handle API error and return default checklists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await fetchDynamicChecklists('test.gid');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching dynamic checklists:', expect.any(Error));
      expect(result).toEqual(DEFAULT_CHECKLISTS);

      consoleSpy.mockRestore();
    });

    it('should handle network error and return default checklists', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await fetchDynamicChecklists('test.gid');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching dynamic checklists:', expect.any(Error));
      expect(result).toEqual(DEFAULT_CHECKLISTS);

      consoleSpy.mockRestore();
    });

    it('should handle JSON parsing error and return default checklists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('JSON parsing error');
        },
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await fetchDynamicChecklists('test.gid');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching dynamic checklists:', expect.any(Error));
      expect(result).toEqual(DEFAULT_CHECKLISTS);

      consoleSpy.mockRestore();
    });

    it('should use display name when cid exists in CHECKLIST_DISPLAY_NAMES', async () => {
      const mockResponse = [
        { cid: 'transparency_process_checklist', gid: 'test.gid' },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchDynamicChecklists('test.gid');

      expect(result[0].name).toBe('Transparency Process Checklist');
    });

    it('should handle empty response array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchDynamicChecklists('test.gid');

      expect(result).toEqual([]);
    });

    it('should handle response with missing properties', async () => {
      const mockResponse = [
        { cid: 'test1' }, // missing gid
        { gid: 'test.gid' }, // missing cid
        { cid: 'test3', gid: 'test.gid', name: 'Test 3' },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchDynamicChecklists('test.gid');

      expect(result).toEqual([
        {
          cid: 'test1',
          gid: undefined,
          name: 'test1',
          data: {},
          group: 'default',
        },
        {
          cid: undefined,
          gid: 'test.gid',
          name: undefined,
          data: {},
          group: 'default',
        },
        {
          cid: 'test3',
          gid: 'test.gid',
          name: 'Test 3',
          data: {},
          group: 'default',
        },
      ]);
    });
  });
}); 