/**
 * Conversion:
 * All dynamic tweaked dom id or class names are prefixed with 't-'.
 */

/**
 * Config
 */

var PRIVATE_TOKEN = 'xYDh7cpVX8BS2unon1hp';

/**
 * Globals.
 */

var autocompleteOpts,
  projectOpts,
  currentProjectID,
  currentProjectPath;

$(function () {
  initGlobals();
  handleAll();
  mapUrlHandler(location.pathname, [
    { pattern: /^\/[^\/]+\/[^\/]+$/, handle: handleProjectDashboard },
    { pattern: /^.+\/tree\/.+/, handle: handleTreeView },
    { pattern: /^.+\/blob\/[^\/]+\/.+\.md$/, handle: handleMdBlobView }
  ]);
});

$(document).ajaxSuccess(function (event, xhr, settings) {
  mapUrlHandler(settings.url, [
    { pattern: /.+\?limit=20/, handle: handleDashboardActivities },
    { pattern: /.+\/refs\/.+\/logs_tree\/.+/, handle: handleLogsTree },
    { pattern: /.+notes\.js\?target_type=issue.+/, handle: handleIssueComments }
  ]);
});

/**
 * Parse useful data from dom elements and assign them to globals for later use.
 */
function initGlobals () {
  autocompleteOpts = JSON.parse($('.search-autocomplete-json').attr('data-autocomplete-opts'));
  projectOpts = _.where(autocompleteOpts, function (opt) {
    if (opt.label.indexOf('project:') !== -1) {
      return true;
    }
  });

  currentUser = $('.profile-pic').attr('href').slice(3);

  currentProjectID = $(document.body).attr('data-project-id');
  currentProjectPath = '/';
  if ($('h1.project_name span').length) {
    currentProjectPath += $('h1.project_name span').text()
    .replace(/\s/, '').replace(/\s/, '').replace(' ', '-').toLowerCase();
  } else {
    currentProjectPath += currentUser + '/' + $('h1.project_name').text().replace(' ', '-').toLowerCase();
  }

  currentBranch = $('.project-refs-select').val();

  console.log(currentUser, currentProjectID, currentProjectPath, currentBranch);
}



/**
 * Document loaded url handlers.
 */

/**
 * Handle tweak tasks for all pages.
 */
function handleAll() {
  $('.home a').attr('href', $('.home a').attr('href') + '#');

  addProjectSelect();
}

/**
 * Handle tweak tasks for project dashboard page.
 */
function handleProjectDashboard() {
  // Nothing to do.
}

/**
 * Handle tweak tasks for files tree view.
 */
function handleTreeView() {
  genMdFileTOCAndAdjustHyperlink();
}

/**
 * Handle tweak tasks for markdown file blob view.
 */
function handleMdBlobView() {
  var slideLink = $('<a class="btn btn-tiny" target="_blank">slide</a>')
  .attr('href', '/reveal/md.html?p=' + location.pathname.replace('blob', 'raw'));
  $('.file-title .options .btn-group a:nth-child(2)').after(slideLink);

  genMdFileTOCAndAdjustHyperlink();
}



/**
 * Add project select on the top bar.
 */
function addProjectSelect() {
  var projectSelectForm = $('<form class="navbar-form pull-left">' +
        '<select id="t-project-list"></select>' +
      '</form>');
  $('.navbar .container .nav li:nth-child(2)').after(projectSelectForm);

  var options = projectOpts.map(function (project) {
    return $('<option />').val(project.url.toLowerCase()).text(project.label.slice(9));
  });

  if (!$('h1.project_name span').length) {
    options.unshift('<option>Go to Project</option>');
  }

  $('#t-project-list').append(options)
  .val(currentProjectPath)
  .change(function () {
    location.href = $(this).val();
  });
}

/**
 * Generate TOC for markdown file.
 */
function genMdFileTOCAndAdjustHyperlink() {
  // Assume there is only one .file-holder.
  var fileHolder = $('.file-holder');
  if (fileHolder.length !== 1) {
    return;
  }

  var fileTitle = fileHolder.find('.file-title'),
    fileContent = fileHolder.find('.file-content');

  fileTitle.wrapInner('<div class="t-file-title-header" />')
  .scrollToFixed();

  var fileTitleFooter = $('<div class="t-file-title-footer"><div class="t-file-title-toc navbar-inner" /></div>')
  .appendTo(fileTitle)
  .hide();

  var fileTitleToc = fileTitleFooter.find('.t-file-title-toc')
  .tocify({
    context: fileContent,
    selectors: 'h1,h2,h3,h4,h5,h6',
    showAndHide: false,
    hashGenerator: 'pretty',
    scrollTo: 38
  });

  // Some special characters will cause tocify hash error, replace them with empty string.
  fileHolder.find('[data-unique]').each(function () {
    $(this).attr('data-unique', $(this).attr('data-unique').replace(/\./g, ''));
  });

  $('<span class="t-file-title-toc-toggler options">' +
    '<div class="btn-group tree-btn-group">' +
      '<a class="btn btn-tiny" title="Table of Content, \'m\' for shortcut.">TOC</a>' +
    '</div>' +
  '</span>')
  .click(function () {
    fileTitleFooter.toggle();
  })
  .appendTo(fileTitle.find('.t-file-title-header'));

  $(document).keyup(function(e) {
    switch (e.which) {
      case 27:
        fileTitleFooter.hide();
        break;
      case 77:
        fileTitleFooter.toggle();
        break;
    }
  });

  // Jumpt to ahchor if has one.
  if (location.hash) {
    var anchor = location.hash.slice(1);
    fileTitleToc.find('li[data-unique="' + anchor + '"] a').click();
  }


  // Adjust hyperlink.
  fileContent.find('a').each(function () {
    var href = $(this).attr('href');

    // Sine 6-2-stable, gitlab will handle relative links when rendering markdown,
    // but it didn't work, all relative links fallback to wikis path,
    // I didn't have much time to figure out why, so I did this quick fix.
    var gitlabPrefixedWikisPath = currentProjectPath + '/wikis/';
    var gitlabPrefixedWikisPathIndex = href.indexOf(gitlabPrefixedWikisPath);
    if (gitlabPrefixedWikisPathIndex != -1) {
      href = href.slice(gitlabPrefixedWikisPath.length);
    }

    // If not start with '/' and doesn't have '//', consider it as a relative path.
    if (/^[^\/]/.test(href) && !/.*\/\/.*/.test(href)) {
      var middlePath;
      // If end with .ext, this is a file path, otherwise is a directory path.
      if (/.*\.[^\/]+$/.test(href)) {
        middlePath = '/blob/';
      } else {
        middlePath = '/tree/';
      }

      $(this).attr('href', currentProjectPath + middlePath + currentBranch + '/' + href);
    }
  });
}




/**
 * Ajax success url handlers.
 */

/**
 * Handle tweak tasks for dashboard activities.
 */
function handleDashboardActivities() {
  // Nothing to do.
}

/**
 * Handle tweak tasks for issue comments.
 */
function handleIssueComments() {
  $('.note-image-attach').each(function () {
    var img = $(this);
    var wrapper = $('<a class="t-fancybox-note-image-attach" rel="gallery-note-image-attach" />')
    .attr('href', img.attr('src'))
    .attr('title', img.attr('alt'));
    img.wrap(wrapper);
    wrapper.commonFancybox();
  });

  $('.t-fancybox-note-image-attach').commonFancybox();
}

/**
 * Handle tweak tasks for git logs tree.
 */
function handleLogsTree() {
  // Nothing to do.
}




/**
 * Helpers.
 */

function mapUrlHandler(url, handlers) {
  handlers.forEach(function (handler) {
    if (handler.pattern.test(url)) {
      handler.handle();
    }
  });
}

function mySetInterval(fn, interval) {
  setTimeout(function () {
    fn(function () {
      mySetInterval(fn, interval);
    });
  }, interval);
}

function myGitLabAPIGet(url, data, cb) {
  $.get('/api/v3/' + url + '?private_token=' + PRIVATE_TOKEN, data, function (data) {
    cb(data);
  });
}




/**
 * Extensions
 */

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

(function ($) {
  $.fn.extend({
    commonFancybox: function () {
      $(this).fancybox({
        closeBtn: false,
        helpers: {
          title: { type : 'inside' },
          buttons: {}
        }
      });
    }
  });
})(jQuery);
