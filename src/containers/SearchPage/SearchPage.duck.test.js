import configureStore from '../../store';
import { searchListings } from './SearchPage.duck';

const categories = [
  { id: 'instagram-post', name: 'Instagram Post' },
  {
    id: 'video',
    name: 'Video',
    subcategories: [{ id: 'reel', name: 'Reel' }],
  },
];

const config = {
  currency: 'USD',
  listing: {
    listingTypes: [],
    listingFields: [],
    enforceValidListingType: false,
  },
  categoryConfiguration: {
    key: 'categoryLevel',
    scope: 'public',
    categories,
  },
  search: {
    defaultFilters: [{ key: 'categoryLevel', schemaType: 'category', scope: 'public' }],
    sortConfig: { active: true, relevanceKey: 'relevance', options: [{ key: 'createdAt' }] },
  },
  user: { userTypes: [] },
};

const createFakeSdk = () => ({
  listings: {
    query: jest.fn(() => Promise.resolve({ data: { data: [], included: [], meta: {} } })),
  },
});

const searchWith = async searchParams => {
  const sdk = createFakeSdk();
  const store = configureStore({ sdk });
  await store.dispatch(searchListings({ searchParams, config }));
  return sdk.listings.query.mock.calls[0][0];
};

describe('SearchPage duck', () => {
  describe('category search params', () => {
    it('queries the top-level category through pub_allCategories', async () => {
      const params = await searchWith({ pub_categoryLevel1: 'instagram-post', perPage: 24 });

      expect(params.pub_allCategories).toEqual('instagram-post');
      expect(params.pub_categoryLevel1).toBeUndefined();
    });

    it('passes subcategories through as they are', async () => {
      const params = await searchWith({
        pub_categoryLevel1: 'video',
        pub_categoryLevel2: 'reel',
        perPage: 24,
      });

      expect(params.pub_allCategories).toEqual('video');
      expect(params.pub_categoryLevel1).toBeUndefined();
      expect(params.pub_categoryLevel2).toEqual('reel');
    });

    it('queries unknown category names through pub_allCategories too', async () => {
      // Note: the value is not validated against the category configuration anymore,
      // an unknown category name simply returns no results.
      const params = await searchWith({ pub_categoryLevel1: 'not-a-category', perPage: 24 });

      expect(params.pub_allCategories).toEqual('not-a-category');
      expect(params.pub_categoryLevel1).toBeUndefined();
    });

    it('does not touch other search params', async () => {
      const params = await searchWith({
        pub_categoryLevel1: 'instagram-post',
        keywords: 'bike',
        perPage: 24,
      });

      expect(params.pub_allCategories).toEqual('instagram-post');
      expect(params.keywords).toEqual('bike');
      expect(params.perPage).toEqual(24);
    });
  });
});
