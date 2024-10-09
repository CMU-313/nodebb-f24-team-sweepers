'use strict';

define('forum/category', [
	'forum/infinitescroll',
	'share',
	'navigator',
	'topicList',
	'sort',
	'categorySelector',
	'hooks',
	'alerts',
	'api',
], function (infinitescroll, share, navigator, topicList, sort, categorySelector, hooks, alerts, api) {
	const Category = {};

	$(window).on('action:ajaxify.start', function (ev, data) {
		if (!String(data.url).startsWith('category/')) {
			navigator.disable();
		}
	});

	Category.init = function () {
		const cid = ajaxify.data.cid;

		app.enterRoom('category_' + cid);

		share.addShareHandlers(ajaxify.data.name);

		topicList.init('category', loadTopicsAfter);

		sort.handleSort('categoryTopicSort', 'category/' + ajaxify.data.slug);

		if (!config.usePagination) {
			navigator.init('[component="category/topic"]', ajaxify.data.topic_count, Category.toTop, Category.toBottom);
		} else {
			navigator.disable();
		}

		handleScrollToTopicIndex();

		handleIgnoreWatch(cid);

		handleLoadMoreSubcategories();

		categorySelector.init($('[component="category-selector"]'), {
			privilege: 'find',
			parentCid: ajaxify.data.cid,
			onSelect: function (category) {
				ajaxify.go('/category/' + category.cid);
			},
		});

		initalizeCategorySearch();
		console.log("Search functionality initialized");

		hooks.fire('action:topics.loaded', { topics: ajaxify.data.topics });
		hooks.fire('action:category.loaded', { cid: ajaxify.data.cid });
	};

	function initalizeCategorySearch() {
		const searchBox = $('#topicSearchInput');
		if (!searchBox.length) {
			console.error("Search box element not found");
			return;
		}

		const searchButton = $('.search-button');
		
		// Perform search on input change
		searchBox.on('input', function () {
			const searchTerm = $(this).val().toLowerCase();
			console.log("Search term: " + searchTerm);
			performTopicSearch(searchTerm);
		});

		// Perform search on enter key press
		searchBox.on('keypress', function (e) {
			if (e.key === 'Enter') {
				const searchTerm = $(this).val().toLowerCase();
				console.log("Search term on enter key press: " + searchTerm);
				performTopicSearch(searchTerm);
			}
		});

		// Perform search when button is clicked
		searchButton.on('click', function () {
			const searchTerm = searchBox.val().toLowerCase();
			console.log("Search term on button click: " + searchTerm);
			performTopicSearch(searchTerm);
		});
	}

	function performTopicSearch(searchTerm) {
		console.log("Performing topic search with term: ", searchTerm);
		const term = searchTerm.toLowerCase();
	
		const $topics = $('[component="category/topic"]');
	
		// Filter the topics based on the search term
		const $matchedTopics = $topics.filter(function () {
			const topicText = $(this).find('h3[component="topic/header"]').text().toLowerCase(); // Get the topic text
			const metaContent = $(this).find('meta[itemprop="name"]').attr('content') ?
				$(this).find('meta[itemprop="name"]').attr('content').toLowerCase() : ''; // Get meta content if it exists
	
			console.log("Checking topic: ", topicText);
			console.log("Meta content: ", metaContent);
	
			// True if either topic text or meta content includes search term
			return topicText.includes(term) || metaContent.includes(term);
		});
	
		// Show matched topics and hide others
		$topics.addClass('hidden');
		$matchedTopics.removeClass('hidden');
	
		// Log visibility changes
		$topics.each(function () {
			const $this = $(this);
			const isVisible = $this.is(':visible');
			console.log(`${isVisible ? "Showing" : "Hiding"} topic: `, $this.find('h3[component="topic/header"]').text());
		});
	
		// Handle case where no topics match the search term
		if ($matchedTopics.length === 0) {
			if ($('[component="category/topic/no-matches"]').length === 0) {
				$(`<div component="category/topic/no-matches" class="alert alert-info">No topics match the search term "${searchTerm}".</div>`)
					.insertAfter('[component="category/topic"]:last');
			} else {
				$('[component="category/topic/no-matches"]').removeClass('hidden');
			}
		} else {
			$('[component="category/topic/no-matches"]').addClass('hidden');
		}
	}

	function handleScrollToTopicIndex() {
		let topicIndex = ajaxify.data.topicIndex;
		if (topicIndex && utils.isNumber(topicIndex)) {
			topicIndex = Math.max(0, parseInt(topicIndex, 10));
			if (topicIndex && window.location.search.indexOf('page=') === -1) {
				navigator.scrollToElement($('[component="category/topic"][data-index="' + topicIndex + '"]'), true, 0);
			}
		}
	}

	function handleIgnoreWatch(cid) {
		$('[component="category/watching"], [component="category/tracking"], [component="category/ignoring"], [component="category/notwatching"]').on('click', function () {
			const $this = $(this);
			const state = $this.attr('data-state');

			api.put(`/categories/${cid}/watch`, { state }, (err) => {
				if (err) {
					return alerts.error(err);
				}

				$('[component="category/watching/menu"]').toggleClass('hidden', state !== 'watching');
				$('[component="category/watching/check"]').toggleClass('fa-check', state === 'watching');

				$('[component="category/tracking/menu"]').toggleClass('hidden', state !== 'tracking');
				$('[component="category/tracking/check"]').toggleClass('fa-check', state === 'tracking');

				$('[component="category/notwatching/menu"]').toggleClass('hidden', state !== 'notwatching');
				$('[component="category/notwatching/check"]').toggleClass('fa-check', state === 'notwatching');

				$('[component="category/ignoring/menu"]').toggleClass('hidden', state !== 'ignoring');
				$('[component="category/ignoring/check"]').toggleClass('fa-check', state === 'ignoring');

				alerts.success('[[category:' + state + '.message]]');
			});
		});
	}

	function handleLoadMoreSubcategories() {
		$('[component="category/load-more-subcategories"]').on('click', async function () {
			const btn = $(this);
			const { categories: data } = await api.get(`/categories/${ajaxify.data.cid}/children?start=${ajaxify.data.nextSubCategoryStart}`);
			btn.toggleClass('hidden', !data.length || data.length < ajaxify.data.subCategoriesPerPage);
			if (!data.length) {
				return;
			}
			app.parseAndTranslate('category', 'children', { children: data }, function (html) {
				html.find('.timeago').timeago();
				$('[component="category/subcategory/container"]').append(html);
				ajaxify.data.nextSubCategoryStart += ajaxify.data.subCategoriesPerPage;
				ajaxify.data.subCategoriesLeft -= data.length;
				btn.toggleClass('hidden', ajaxify.data.subCategoriesLeft <= 0)
					.translateText('[[category:x-more-categories, ' + ajaxify.data.subCategoriesLeft + ']]');
			});

			return false;
		});
	}

	Category.toTop = function () {
		navigator.scrollTop(0);
	};

	Category.toBottom = async () => {
		const { count } = await api.get(`/categories/${ajaxify.data.category.cid}/count`);
		navigator.scrollBottom(count - 1);
	};

	function loadTopicsAfter(after, direction, callback) {
		callback = callback || function () {};

		hooks.fire('action:topics.loading');
		const params = utils.params();
		infinitescroll.loadMore(`/categories/${ajaxify.data.cid}/topics`, {
			after: after,
			direction: direction,
			query: params,
			categoryTopicSort: params.sort || config.categoryTopicSort,
		}, function (data, done) {
			hooks.fire('action:topics.loaded', { topics: data.topics });
			callback(data, done);
		});
	}

	return Category;
});
