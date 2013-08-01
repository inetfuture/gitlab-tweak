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
  currentProjectID = $(document.body).attr('data-project-id');
  currentProjectPath = '/' +
    $('h1.project_name span').text().replace(/\s/, '').replace(/\s/, '').replace(' ', '-').toLowerCase();
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
  //redirectToFilesTab();
}

/**
 * Handle tweak tasks for files tree view.
 */
function handleTreeView() {
  genMdFileTOC();
}

/**
 * Handle tweak tasks for markdown file blob view.
 */
function handleMdBlobView() {
  var slideLink = $('<a class="btn btn-tiny" target="_blank">slide</a>')
  .attr('href', '/reveal/md.html?p=' + location.pathname.replace('blob', 'raw'));
  $('.file_title .options .btn-group a:nth-child(2)').after(slideLink);

  genMdFileTOC();
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
    return $('<option />').val(project.url).text(project.label.slice(9));
  });

  if (!$('h1.project_name span').length) {
    options.unshift('<option>Go to Project</option>');
  }

  var currentProjectPath = '/' +
    $('h1.project_name span').text().replace(/\s/, '').replace(/\s/, '').replace(' ', '-').toLowerCase();
  $('#t-project-list').append(options)
  .val(currentProjectPath)
  .change(function () {
    location.href = $(this).val();
  });
}

/**
 * Redirect to 'Files' tab if the url is not surfixed with '#' character.
 */
function redirectToFilesTab() {
  //
  if (location.href.indexOf('#') === -1) {
    myGitLabAPIGet('projects/' + currentProjectID, null, function (data) {
      if (data.default_branch !== null) {
        location.href += '/tree/' + data.default_branch;
      }
    });
  }
}

/**
 * Generate TOC for markdown file.
 */
function genMdFileTOC() {
  // Assume there is only one .file_holder.
  var fileHolder = $('.file_holder');
  if (fileHolder.length !== 1) {
    return;
  }

  var fileTitle = fileHolder.find('.file_title'),
    fileContent = fileHolder.find('.file_content');

  fileTitle.wrapInner('<div class="t-file-title-header" />')
  .scrollToFixed();

  var fileTitleFooter = $('<div class="t-file-title-footer"><div class="t-file-title-toc navbar-inner" /></div>')
  .appendTo(fileTitle)
  .hide();

  // Some special characters will cause tocify hash error, replace them with empty string.
  fileContent.find('h1, h2, h3, h4, h5').each(function () {
    $(this).html($(this).html().replace(/\./g, ''));
  });

  var fileTitleToc = fileTitleFooter.find('.t-file-title-toc')
  .tocify({
    context: fileContent,
    showAndHide: false,
    hashGenerator: 'pretty',
    scrollTo: 38
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
}




/**
 * Ajax success url handlers.
 */

/**
 * Handle tweak tasks for dashboard activities.
 */
function handleDashboardActivities() {
  $('.note-file-attach').commonFancybox();
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

