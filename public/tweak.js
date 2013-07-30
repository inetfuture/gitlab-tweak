/**
 * Conversion:
 * All dynamic tweaked dom id or class names are prefixed with 't-'.
 */

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
    { pattern: /^.+\/blob\/[^\/]+\/.+\.md$/, handle: handleMdView }
  ]);
});

$(document).ajaxSuccess(function (event, xhr, settings) {
  mapUrlHandler(settings.url, [
    { pattern: /.+\?limit=20/, handle: handleDashboardActivities },
    { pattern: /.+notes\.js\?target_type=issue.+/, handle: handleIssueComments },
    { pattern: /.+\/refs\/.+\/logs_tree\/.+/, handle: handleLogsTree }
  ]);
});

/**
 * Document loaded url handlers.
 */

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
 * Handle tweak tasks for all pages.
 */
function handleAll() {
  $('.home a').attr('href', $('.home a').attr('href') + '#');

  addProjectSelect();
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
 * Handle tweak tasks for project dashboard page.
 */
function handleProjectDashboard() {
  // Redirect to 'Files' tab if the url is not surfixed with '#' character.
  if (location.href.indexOf('#') === -1) {
    myGitLabAPIGet('projects/' + currentProjectID, null, function (data) {
      if (data.default_branch !== null) {
        location.href += '/tree/' + data.default_branch;
      }
    });
  }
}

function handleMdView() {
  console.log(1);
  var slideLink = $('<a class="btn btn-tiny" target="_blank">slide</a>')
    .attr('href', '/reveal/md.html?p=' + location.pathname.replace('blob', 'raw'));
  $('.file_title .options .btn-group a:nth-child(2)').after(slideLink);
}

/**
 * Ajax success url handlers.
 */

function handleDashboardActivities() {
  $('.note-file-attach').commonFancybox();
}

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
  $.get('/api/v3/' + url + '?private_token=xYDh7cpVX8BS2unon1hp', data, function (data) {
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

