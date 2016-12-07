var APPLICATION_ID = '52C0QP0KEX';
var SEARCH_ONLY_API_KEY = '73bbe382c2296689c20989f6b9e7f606';
var INDEX_NAME = 'Restaurants';
var PARAMS = {
  hitsPerPage: 3,
  maxValuesPerFacet: 8,
  disjunctiveFacets: ['food_type'],
  facets: ['stars','payment_options'],
  index: INDEX_NAME
};

var FACETS_LABELS = {food_type: 'Food Type', stars: 'Stars', payment_options: 'Payment Options'};
var FACETS_ORDER_OF_DISPLAY = ['food_type', 'stars', 'payment_options'];
var FACETS_SORTING_RULES = {
  'food_type' : ['count:desc'],
  'stars' : ['name:asc'],
  'payment_options' : ['count:desc'],
}

var algolia = algoliasearch(APPLICATION_ID, SEARCH_ONLY_API_KEY);
var algoliaHelper = algoliasearchHelper(algolia, INDEX_NAME, PARAMS);

$searchInput = $('#search-input');
$main = $('main');
$hits = $('#hits');
$stats = $('#stats');
$facets = $('#facets');

var hitTemplate = Hogan.compile($('#hit-template').text());
var statsTemplate = Hogan.compile($('#stats-template').text());
var facetTemplate = Hogan.compile($('#facet-template').text());
var sliderTemplate = Hogan.compile($('#slider-template').text());
var noResultsTemplate = Hogan.compile($('#no-results-template').text());


$searchInput
.on('keyup', function() {
  var query = $(this).val();
  algoliaHelper.setQueryParameter('aroundLatLngViaIP', true)
  algoliaHelper.setQuery(query).search();
})
.focus();

algoliaHelper.on('result', function(content, state) {
  renderStats(content);
  renderHits(content);
  renderFacets(content, state)
  renderStarFacets();
  renderHitStars();
});

function renderHits(content) {
  $hits.html(hitTemplate.render(content));
}

function renderStats(content) {
  var stats = {
    nbHits: content.nbHits,
    nbHits_plural: content.nbHits !== 1,
    processingTimeMS: content.processingTimeMS
  };
  $stats.html(statsTemplate.render(stats));
}

function renderFacets(content, state) {
  var facetsHtml = '';
  for (var facetIndex = 0; facetIndex < FACETS_ORDER_OF_DISPLAY.length; ++facetIndex) {
    var facetName = FACETS_ORDER_OF_DISPLAY[facetIndex];
    var facetResult = content.getFacetByName(facetName);
    var facetContent = {};
    if (facetResult) {
      facetContent = {
        facet: facetName,
        title: FACETS_LABELS[facetName],
        values: content.getFacetValues(facetName, {sortBy: FACETS_SORTING_RULES[facetName]}),
        disjunctive: $.inArray(facetName, PARAMS.disjunctiveFacets) !== -1
      };
      facetsHtml += facetTemplate.render(facetContent);
    }
    $facets.html(facetsHtml);
  }
}

function renderStarFacets() {
  $starFacets = $('h5:eq(1)').nextUntil('h5');
  $.each($starFacets, function(index, value) {
    $star = $(this).children().first();
    var starsCount = $star.data('value');
    $star.text('');
    $star.raty({path : 'assets/images/', readOnly: true, score: starsCount})
  });
}

function renderHitStars() {
  $hitStars = $('.hit-stars');
  $.each($hitStars, function(index, value) {
    var stars = parseInt($(this).text());
    $(this).text('');
    $(this).raty({path : 'assets/images/', readOnly: true, score: stars})
  });
}

$(document).on('click', '.toggle-refine', function(e) {
  e.preventDefault();
  algoliaHelper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
});
