import { pickAdditionalCategoryIds } from './fieldHelpers';

describe('fieldHelpers', () => {
  describe('pickAdditionalCategoryIds', () => {
    const categoryOptions = [
      { id: 'cats', name: 'Cats' },
      { id: 'dogs', name: 'Dogs' },
      { id: 'birds', name: 'Birds' },
    ];

    it('picks valid category ids', () => {
      expect(pickAdditionalCategoryIds(['dogs', 'birds'], 'cats', categoryOptions)).toEqual([
        'dogs',
        'birds',
      ]);
    });

    it('drops the primary category, unknown ids and duplicates', () => {
      expect(
        pickAdditionalCategoryIds(['cats', 'dogs', 'fish', 'dogs'], 'cats', categoryOptions)
      ).toEqual(['dogs']);
    });

    it('returns an empty array for missing or invalid data', () => {
      expect(pickAdditionalCategoryIds(undefined, 'cats', categoryOptions)).toEqual([]);
      expect(pickAdditionalCategoryIds(null, 'cats', categoryOptions)).toEqual([]);
      expect(pickAdditionalCategoryIds('dogs', 'cats', categoryOptions)).toEqual([]);
      expect(pickAdditionalCategoryIds(['dogs'], 'cats', [])).toEqual([]);
    });
  });
});
