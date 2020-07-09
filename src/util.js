
let categories = [];
let mappings = {};

module.exports.setCategoires = _categories => categories = _categories;
module.exports.setMappings = _mappnigs => mappings = _mappnigs;

/**
 * Validates categories.
 * Accepts either a single category or a list of categories. If a single category has been requested,
 * the worker will respond with a single one. If a list of categories has been requested, the worker
 * will respond with a list.
 *
 * A single category might be `null` or a valid category. `null` indicates that the cateory is not valid
 * A list of categories will only contain valid categories but might be empty.
 * @param {*} categoryOrCategories A single category or a list of categories to validate
 * @returns A single validated vategory or a list of validated categories
 */
module.exports.validateCategories = function validateCategories(categoryOrCategories) {
    if (typeof categoryOrCategories === 'string')
        return validateCategory(categoryOrCategories)

    if (Array.isArray(categoryOrCategories))
        return categoryOrCategories.map(validateCategory).filter(c => !!c);

    throw new Error('Input is neither a string nor a list of strings');
}

/**
 * Validates a category by removing invalid characters and norming it.
 * @param {*} category 
 */
module.exports.validateCategory = function validateCategory(category) {
    const escaped = escapeCategory(category);
    return escaped ? normCategory(escaped) : null;
}

/**
 * Tries to find a matching category for a category provided by the user.
 * There are two rules:
 *  1. Case correction: If the category case insentive matchs an existing one,
 *     that category is used.
 *  2. Category mapping: If there is a category mapping that matches,
 *     the mapping is applied (also case insentive).
 * 
 * These only one of the two rules is applied and that only once, as detecting
 * loops would be to much work.
 * @param {string} category The category to norm
 */
module.exports.normCategory = async function normCategory(category) {
    // 1. Case correct
    const match = categories.find(c => category.localeCompare(c, undefined, { sensitivity: 'base' }) === 0)
    if (match)
        return match;

    // 2. Check mappings
    const mapping = Object.keys(mappings).find(m => category.localeCompare(m, undefined, { sensitivity: 'base' }) === 0);
    if (mapping)
        return mappings[mapping];

    return category;
}

/**
 * Takes a string and returns a single valid categroy, consisting of only alphanumeric characters and _ and beginning with a letter.
 * Returns null, if the category is not a string or contains no valid charactesrs.
 * @param {string} category The category to escape
 */
module.exports.escapeCategory = function escapeCategory(category) {
    if (!category) return null;
    if (typeof category !== 'string') return null;
    return category
        .replace(/[^\wäöüß]/gi, '')       // Removes all characters that are not alphanumeric or _
        .replace(/^[\d_]+/g, '') || null; // Removes digits and _ from the beginning of the string
}
