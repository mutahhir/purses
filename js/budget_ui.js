
var planner = new Purses();

var updateIncomeAndBudgetStatement = function updateIncomeAndBudgetStatement() {
	$('#budgetStatement').html(function(index, oldHtml) {
		var income = planner.income(),
			planned = planner.totalPlanned();
			incomeTemplate = 'Planning for a {{income}} income. <a id="changeIncome" href="#">Change?</a>',
			nothingPlannedTemplate = "You&rsquo;ve not budgeted any of your income. Start below!",
			somePlannedTemplate = 'You&rsquo;ve budgeted <span id="managedFigure" class="managed figure">{{planned}}</span>, but you still have <span id="unmanagedFigure" class="unmanaged figure">{{unplanned}}</span> left to budget',
			overPlannedTemplate = 'Oops, looks like you&rsquo;re running short of money this month. You&rsquo;re <span class="unmanaged figure">{{over}}</span> over your income. Try adjusting your budget, or <a href="#">maybe take a loan from yourself.</a>';
			fullyPlannedTemplate = 'Great! Your budget is fully balanced, now comes the hard part. <em>Stick to it!</em>',
			wrapElement = '<h4>',
			endWrapElement = '</h4>',
			statement = '';

		if (planned === 0) {
			statement = nothingPlannedTemplate;
		} else if (planned < income) {
			statement = somePlannedTemplate;
		} else if (planned > income){
			statement = overPlannedTemplate;
		} else {
			statement = fullyPlannedTemplate;
		}

		var resultTemplate = "<p>" + incomeTemplate + "</p>" +
			wrapElement + statement + endWrapElement;

		return Mustache.render(resultTemplate, {
			income: income,
			planned: planned,
			unplanned: income - planned,
			over: planned - income
		});
	});
};

var makePurseHtml = function makePurseHtml(purse) {
	var template = '<tr class="item">' +
		'<td class="purse span6">{{head}}</td>' +
		'<td class="value span2">{{value}}</td>' +
	'</tr>';

	return Mustache.render(template, purse);
};

var updatePurses = function updatePurses() {
	var purses = planner.purses(),
		numPurses = purses.length,
		pursesTableEl = $('#budget'),
		items = [],
		html = '';

	pursesTableEl.empty();

	for (var i = 0; i < numPurses; i++) {
		items.push(makePurseHtml(purses[i]));
	}

	$(items.join('\n')).appendTo(pursesTableEl);
};

var addPurse = function addPurse(obj) {
	$(makePurseHtml(obj)).appendTo($("#budget"));

	// clear up everything and reset focus to original
	$('#newBudgetItem input[type="text"]').val("").first().focus();

	updateIncomeAndBudgetStatement();
};

var makeDisplayMonth = function makeDisplayMonth(dt) {
	var segs = dt.split('/'),
		monthNum = segs[0],
		yearNum = segs[1],
		res = [],
		months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

	return [months[monthNum-1],yearNum].join(', ');
};

var onMonthChanged = function onMonthChanged(e) {
	var currentMonth = (e && e.newMonth) || planner.currentMonth();
	var monthDescriptionEl = $('#monthDescription');
	monthDescriptionEl.data('month', currentMonth);
	monthDescriptionEl.text(makeDisplayMonth(currentMonth));

	updateIncomeAndBudgetStatement();
	updatePurses();
};

var onIncomeChanged = function onIncomeChanged(evType, e) {
	updateIncomeAndBudgetStatement();
};

var onPurseAdded = function onPurseAdded(evType, e) {
	addPurse(e);
};

var onPurseDeleted = function onPurseDeleted(evType, e) {

};

function cachePurseItems() {
	var els = $('[data-provide="typeahead"]');
	if (itemArray.length === 0) {
		itemArray = ["Rent", "School Fees", "Groceries", "Utility", "Electricity", "Gas", "Water", "Savings", "Insurance",
		"Transport", "Entertainment", "Child care", "Day care", "Maintenance", "Rainy Day Fund",
		"Dining out", "School Lunch", "Oil", "Cable", "Telephone", "Internet", "Satellite", "Garbage Pickup",
		"Cell Phone", "House Cleaner", "Mortgage", "Tax", "Property Tax", "Property Insurance",
		"Laundry Supplies", "Cleaning Supplies", "Furniture", "Appliances", "Linens", "Toiletries",
		"Stationery", "Parking", "Medical", "Health Insurance", "Books", "Gifts", "Car", "Vacation", "Investment",
		"Movies", "Clothing", "Medicine"];
	}

	els.data('source', itemArray);
}

var planner = new Purses(),
	itemArray = [];

var startup = function startup() {
	onMonthChanged();
	updateIncomeAndBudgetStatement();
	cachePurseItems();
};



/*
	purses-month-changed
	purses-income-changed
	purses-add-purse
	purses-delete-purse
*/

PubSub.subscribe('purses-month-changed', onMonthChanged);
PubSub.subscribe('purses-income-changed', onIncomeChanged);
PubSub.subscribe('purses-add-purse', onPurseAdded);
PubSub.subscribe('purses-delete-purse', onPurseDeleted);


var navbarUpdateOnScroll = function(e) {
	if (document.body.scrollTop > 25) {
		$("#navbar").css({
			'opacity': 0.5
		});

		$('#brandLink').css({
			position: 'fixed',
			left: '10px'
		});
	} else {
		$("#navbar").css({
			opacity: 1
		});

		$('#brandLink').css({
			position: '',
			left: ''
		});
	}
};

$(function() {
	$(document).on('scroll', navbarUpdateOnScroll);
	startup();

	$('#changeMonthPrevious').click(function(e) {
		var monthDescriptionEl = $('#monthDescription'),
			monthTag = monthDescriptionEl.data('month'),
			monthSegments = monthTag.split('/'),
			monthNumber = parseInt(monthSegments[0],10),
			yearNumber = parseInt(monthSegments[1],10);

		monthNumber--;
		if (monthNumber === 0) {
			yearNumber--;
			monthNumber = 12;
		}

		planner.setMonth([monthNumber,yearNumber].join('/'));
	});

	$('#changeMonthNext').click(function(e) {
		var monthDescriptionEl = $('#monthDescription'),
			monthTag = monthDescriptionEl.data('month'),
			monthSegments = monthTag.split('/'),
			monthNumber = parseInt(monthSegments[0],10),
			yearNumber = parseInt(monthSegments[1],10);

		monthNumber++;
		if (monthNumber === 13) {
			yearNumber++;
			monthNumber = 1;
		}

		planner.setMonth([monthNumber, yearNumber].join('/'));
	});

	$('#newBudgetItem').submit(function(e) {
		var items = $(':input[type="text"]', $(e.target)),
			formValue = {};

		_.forEach(items, function(item) {
			var $item = $(item);
			formValue[item.name] = $item.val();
		});

		if (!validateFields(formValue.head, formValue.value)) {
			return false;
		}

		planner.addPurse(formValue.head, formValue.value);
		return false;
	});

	$('#changeIncome').live('click', function() {
		var modal = '<div id="myModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
			'<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
				'<h3>Change Income</h3>' +
			'</div>' +
			'<div class="modal-body">' +
				'<form id="editableIncomeArea" class="form form-inline" action="">' +
					'<p>Change income to '+
						'<input id="incomeInput" type="text" class="income figure" value="{{.}}"></input>&nbsp;' +
					'</p>'+
				'</form>' +
			'</div>'+
				'<div class="modal-footer">' +
					'<a href="#" class="btn" data-dismiss="modal">Close</a>' +
					'<a href="#" class="btn btn-primary" id="#saveNewIncome" data-dismiss="modal">Save changes</a>' +
				'</div>' +
			'</div>';

		var $dest = $('#main');

		var elem = $(Mustache.render(modal, planner.income())).appendTo($dest);
		elem.modal('show');

		var save = false;
		elem.on('shown', function() {
			$('#incomeInput').focus();
			$('#saveNewIncome').click(function() {
				save = true;
			});
			$('#incomeInput').keydown(function(e) {
				if (e.which === 13) {
					save = true;
					elem.modal('hide');
				}
			});
		});

		$(elem).on('hidden', function() {
			if (save) {
				var newIncome = $('#incomeInput').val();
				planner.setIncome(newIncome);
				updateIncomeAndBudgetStatement();
				$('#headInput').focus();
				updateIncomeAndBudgetStatement();
			}

			elem.remove();
		});
	});

	function validateFields(head, value) {
		var res = [];

		$('#newBudgetItem').removeClass('error');
		$('.alert').alert('close');
		$('.alert').remove();

		if (!planner.validateNewPurse(head, value, res)) {
			// failed
			$('#newBudgetItem').addClass('error');

			var $errors = $(Mustache.render('<div class="alert alert-block alert-error fade in">'+
									'<a class="close" data-dismiss="alert" href="#">&times;</a>'+
									'<h4>Errors</h4>'+
									'<br/>' +
										"{{#errors}}" + 
											'<p>{{message}}</p>' +
										"{{/errors}}" +
									'</div>', {errors: res})).insertAfter('#newBudgetItem').alert();
			return false;
		} else {
			return true;
		}
	}
});	// --- END OF STARTUP FN