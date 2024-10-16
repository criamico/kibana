/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { createSavedSearchesLoader } from './legacy/saved_searches';

export { getSavedSearch } from './get_saved_searches';
export {
  getSavedSearchUrl,
  getSavedSearchFullPathUrl,
  getSavedSearchUrlConflictMessage,
  throwErrorOnSavedSearchUrlConflict,
} from './saved_searches_utils';
export { useSavedSearchAliasMatchRedirect } from './saved_search_alias_match_redirect';
export { SavedSearchURLConflictCallout } from './saved_search_url_conflict_callout';
export { saveSavedSearch, SaveSavedSearchOptions } from './save_saved_searches';

export { SAVED_SEARCH_TYPE } from './constants';

export type { SavedSearch } from './types';
export type { LegacySavedSearch, SavedSearchLoader, SortOrder } from './legacy/types';

/** @deprecated __LEGACY object will be removed in v8**/
export const __LEGACY = {
  createSavedSearchesLoader,
};
