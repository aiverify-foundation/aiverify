import {
  InputBlockData,
  InputBlockChecklist,
  InputBlockGroup,
  Checklist,
  FairnessTreeData,
  FairnessTree,
  GroupedChecklists,
  ChecklistProgress,
} from '../types';

describe('InputBlockData', () => {
  it('should allow string key-value pairs', () => {
    const data: InputBlockData = {
      'completed-2.1.1': 'Yes',
      'completed-2.1.2': 'No',
      'completed-2.1.3': 'Maybe',
    };

    expect(data['completed-2.1.1']).toBe('Yes');
    expect(data['completed-2.1.2']).toBe('No');
    expect(data['completed-2.1.3']).toBe('Maybe');
  });

  it('should allow empty object', () => {
    const data: InputBlockData = {};
    expect(Object.keys(data)).toHaveLength(0);
  });

  it('should allow dynamic keys', () => {
    const key = 'dynamic-key';
    const value = 'dynamic-value';
    const data: InputBlockData = {
      [key]: value,
    };

    expect(data[key]).toBe(value);
  });
});

describe('InputBlockChecklist', () => {
  it('should have all required properties', () => {
    const checklist: InputBlockChecklist = {
      gid: 'aiverify.stock.process_checklist',
      cid: 'explainability_process_checklist',
      name: 'explainability_process_checklist',
      group: 'check a',
      data: { 'completed-2.1.1': 'Yes' },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      groupNumber: 1,
    };

    expect(checklist.gid).toBe('aiverify.stock.process_checklist');
    expect(checklist.cid).toBe('explainability_process_checklist');
    expect(checklist.name).toBe('explainability_process_checklist');
    expect(checklist.group).toBe('check a');
    expect(checklist.data).toEqual({ 'completed-2.1.1': 'Yes' });
    expect(checklist.id).toBe(1);
    expect(checklist.created_at).toBe('2023-01-01T00:00:00Z');
    expect(checklist.updated_at).toBe('2023-01-01T00:00:00Z');
    expect(checklist.groupNumber).toBe(1);
  });

  it('should allow optional groupNumber', () => {
    const checklist: InputBlockChecklist = {
      gid: 'aiverify.stock.process_checklist',
      cid: 'explainability_process_checklist',
      name: 'explainability_process_checklist',
      group: 'check a',
      data: { 'completed-2.1.1': 'Yes' },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    expect(checklist.groupNumber).toBeUndefined();
  });
});

describe('InputBlockGroup', () => {
  it('should have all required properties', () => {
    const group: InputBlockGroup = {
      gid: 'aiverify.stock.process_checklist',
      groupName: 'Test Group',
      inputBlocks: [],
      data: { 'completed-2.1.1': 'Yes' },
    };

    expect(group.gid).toBe('aiverify.stock.process_checklist');
    expect(group.groupName).toBe('Test Group');
    expect(group.inputBlocks).toEqual([]);
    expect(group.data).toEqual({ 'completed-2.1.1': 'Yes' });
  });

  it('should allow empty inputBlocks array', () => {
    const group: InputBlockGroup = {
      gid: 'aiverify.stock.process_checklist',
      groupName: 'Test Group',
      inputBlocks: [],
      data: {},
    };

    expect(group.inputBlocks).toHaveLength(0);
  });
});

describe('Checklist', () => {
  it('should be compatible with InputBlockChecklist', () => {
    const checklist: Checklist = {
      gid: 'aiverify.stock.process_checklist',
      cid: 'explainability_process_checklist',
      name: 'explainability_process_checklist',
      group: 'check a',
      data: { 'completed-2.1.1': 'Yes' },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    expect(checklist).toBeDefined();
    expect(checklist.gid).toBe('aiverify.stock.process_checklist');
  });
});

describe('FairnessTreeData', () => {
  it('should have all required properties', () => {
    const fairnessData: FairnessTreeData = {
      sensitiveFeature: 'gender',
      favourableOutcomeName: 'approved',
      qualified: 'qualified',
      unqualified: 'unqualified',
      selectedOutcomes: ['outcome1', 'outcome2'],
      metrics: ['metric1', 'metric2'],
      selections: {
        nodes: ['node1', 'node2'],
        edges: ['edge1', 'edge2'],
      },
    };

    expect(fairnessData.sensitiveFeature).toBe('gender');
    expect(fairnessData.favourableOutcomeName).toBe('approved');
    expect(fairnessData.qualified).toBe('qualified');
    expect(fairnessData.unqualified).toBe('unqualified');
    expect(fairnessData.selectedOutcomes).toEqual(['outcome1', 'outcome2']);
    expect(fairnessData.metrics).toEqual(['metric1', 'metric2']);
    expect(fairnessData.selections.nodes).toEqual(['node1', 'node2']);
    expect(fairnessData.selections.edges).toEqual(['edge1', 'edge2']);
  });

  it('should allow additional string properties', () => {
    const fairnessData: FairnessTreeData = {
      sensitiveFeature: 'gender',
      favourableOutcomeName: 'approved',
      qualified: 'qualified',
      unqualified: 'unqualified',
      selectedOutcomes: [],
      metrics: [],
      selections: {
        nodes: [],
        edges: [],
      },
      'ans-custom-field': 'custom value',
    };

    expect(fairnessData['ans-custom-field']).toBe('custom value');
  });

  it('should allow additional array properties', () => {
    const fairnessData: FairnessTreeData = {
      sensitiveFeature: 'gender',
      favourableOutcomeName: 'approved',
      qualified: 'qualified',
      unqualified: 'unqualified',
      selectedOutcomes: [],
      metrics: [],
      selections: {
        nodes: [],
        edges: [],
      },
      'ans-array-field': ['item1', 'item2'],
    };

    expect(fairnessData['ans-array-field']).toEqual(['item1', 'item2']);
  });

  it('should allow additional object properties', () => {
    const fairnessData: FairnessTreeData = {
      sensitiveFeature: 'gender',
      favourableOutcomeName: 'approved',
      qualified: 'qualified',
      unqualified: 'unqualified',
      selectedOutcomes: [],
      metrics: [],
      selections: {
        nodes: [],
        edges: [],
      },
      'ans-object-field': { nested: 'value' } as any,
    };

    expect(fairnessData['ans-object-field']).toEqual({ nested: 'value' });
  });
});

describe('FairnessTree', () => {
  it('should have all required properties', () => {
    const fairnessTree: FairnessTree = {
      gid: 'aiverify.stock.fairness',
      cid: 'fairness_checklist',
      name: 'Fairness Checklist',
      group: 'fairness',
      data: {
        sensitiveFeature: 'gender',
        favourableOutcomeName: 'approved',
        qualified: 'qualified',
        unqualified: 'unqualified',
        selectedOutcomes: [],
        metrics: [],
        selections: {
          nodes: [],
          edges: [],
        },
      },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    expect(fairnessTree.gid).toBe('aiverify.stock.fairness');
    expect(fairnessTree.cid).toBe('fairness_checklist');
    expect(fairnessTree.name).toBe('Fairness Checklist');
    expect(fairnessTree.group).toBe('fairness');
    expect(fairnessTree.data).toBeDefined();
    expect(fairnessTree.id).toBe(1);
    expect(fairnessTree.created_at).toBe('2023-01-01T00:00:00Z');
    expect(fairnessTree.updated_at).toBe('2023-01-01T00:00:00Z');
  });

  it('should allow optional id, created_at, and updated_at', () => {
    const fairnessTree: FairnessTree = {
      gid: 'aiverify.stock.fairness',
      cid: 'fairness_checklist',
      name: 'Fairness Checklist',
      group: 'fairness',
      data: {
        sensitiveFeature: 'gender',
        favourableOutcomeName: 'approved',
        qualified: 'qualified',
        unqualified: 'unqualified',
        selectedOutcomes: [],
        metrics: [],
        selections: {
          nodes: [],
          edges: [],
        },
      },
    };

    expect(fairnessTree.id).toBeUndefined();
    expect(fairnessTree.created_at).toBeUndefined();
    expect(fairnessTree.updated_at).toBeUndefined();
  });
});

describe('GroupedChecklists', () => {
  it('should allow grouping checklists by name', () => {
    const groupedChecklists: GroupedChecklists = {
      'Group A': [
        {
          gid: 'aiverify.stock.process_checklist',
          cid: 'checklist1',
          name: 'Checklist 1',
          group: 'Group A',
          data: {},
          id: 1,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          gid: 'aiverify.stock.process_checklist',
          cid: 'checklist2',
          name: 'Checklist 2',
          group: 'Group A',
          data: {},
          id: 2,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
      'Group B': [
        {
          gid: 'aiverify.stock.process_checklist',
          cid: 'checklist3',
          name: 'Checklist 3',
          group: 'Group B',
          data: {},
          id: 3,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
    };

    expect(groupedChecklists['Group A']).toHaveLength(2);
    expect(groupedChecklists['Group B']).toHaveLength(1);
    expect(groupedChecklists['Group A'][0].name).toBe('Checklist 1');
    expect(groupedChecklists['Group A'][1].name).toBe('Checklist 2');
    expect(groupedChecklists['Group B'][0].name).toBe('Checklist 3');
  });

  it('should allow empty groups', () => {
    const groupedChecklists: GroupedChecklists = {
      'Empty Group': [],
    };

    expect(groupedChecklists['Empty Group']).toHaveLength(0);
  });
});

describe('ChecklistProgress', () => {
  it('should have all required properties', () => {
    const progress: ChecklistProgress = {
      id: 'checklist-1',
      name: 'Test Checklist',
      isCompleted: true,
      progress: 100,
    };

    expect(progress.id).toBe('checklist-1');
    expect(progress.name).toBe('Test Checklist');
    expect(progress.isCompleted).toBe(true);
    expect(progress.progress).toBe(100);
  });

  it('should allow incomplete progress', () => {
    const progress: ChecklistProgress = {
      id: 'checklist-1',
      name: 'Test Checklist',
      isCompleted: false,
      progress: 50,
    };

    expect(progress.isCompleted).toBe(false);
    expect(progress.progress).toBe(50);
  });

  it('should allow zero progress', () => {
    const progress: ChecklistProgress = {
      id: 'checklist-1',
      name: 'Test Checklist',
      isCompleted: false,
      progress: 0,
    };

    expect(progress.progress).toBe(0);
  });

  it('should allow full progress', () => {
    const progress: ChecklistProgress = {
      id: 'checklist-1',
      name: 'Test Checklist',
      isCompleted: true,
      progress: 100,
    };

    expect(progress.progress).toBe(100);
  });
});

describe('Type Compatibility', () => {
  it('should allow InputBlockChecklist to be assigned to Checklist', () => {
    const inputBlockChecklist: InputBlockChecklist = {
      gid: 'aiverify.stock.process_checklist',
      cid: 'explainability_process_checklist',
      name: 'explainability_process_checklist',
      group: 'check a',
      data: { 'completed-2.1.1': 'Yes' },
      id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const checklist: Checklist = inputBlockChecklist;
    expect(checklist).toBeDefined();
  });

  it('should allow FairnessTreeData to have dynamic properties', () => {
    const fairnessData: FairnessTreeData = {
      sensitiveFeature: 'gender',
      favourableOutcomeName: 'approved',
      qualified: 'qualified',
      unqualified: 'unqualified',
      selectedOutcomes: [],
      metrics: [],
      selections: {
        nodes: [],
        edges: [],
      },
    };

    // Test dynamic property assignment
    (fairnessData as any)['ans-custom'] = 'value';
    (fairnessData as any)['ans-array'] = ['item1', 'item2'];
    (fairnessData as any)['ans-object'] = { nested: 'value' };

    expect((fairnessData as any)['ans-custom']).toBe('value');
    expect((fairnessData as any)['ans-array']).toEqual(['item1', 'item2']);
    expect((fairnessData as any)['ans-object']).toEqual({ nested: 'value' });
  });
}); 