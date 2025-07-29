import { UserFlows } from '../userFlowsEnum';

describe('UserFlows', () => {
  it('should have all expected enum values', () => {
    expect(UserFlows.NewProject).toBe('1');
    expect(UserFlows.NewProjectWithNewTemplate).toBe('2');
    expect(UserFlows.NewProjectWithExistingTemplateAndResults).toBe('3');
    expect(UserFlows.NewProjectWithExistingTemplateAndRunNewTests).toBe('4');
    expect(UserFlows.NewProjectWithExistingTemplate).toBe('5');
    expect(UserFlows.NewProjectWithNewTemplateAndResults).toBe('6');
    expect(UserFlows.NewProjectWithNewTemplateAndRunNewTests).toBe('7');
    expect(UserFlows.EditExistingProject).toBe('8');
    expect(UserFlows.ViewTemplate).toBe('9');
    expect(UserFlows.EditExistingProjectWithResults).toBe('10');
    expect(UserFlows.NewTemplate).toBe('11');
    expect(UserFlows.NewProjectWithEditingExistingTemplate).toBe('12');
    expect(UserFlows.NewProjectWithEditingExistingTemplateAndResults).toBe('13');
  });

  it('should have unique values', () => {
    const values = Object.values(UserFlows);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('should have string values', () => {
    Object.values(UserFlows).forEach(value => {
      expect(typeof value).toBe('string');
    });
  });
}); 