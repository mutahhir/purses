$(function() {
	planner = new BudgetPlanner(2000);

	$('#income').text(2000);

	function updateDateFromData(el) {
		var dt = el.data('month'),
			segs = dt.split('/'),
			monthNum = segs[0],
			yearNum = segs[1],
			res = [],
			months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

		el.text([months[monthNum-1],yearNum].join(', '));
	}

	updateDateFromData($("#monthDescription"));
	
	function updateStatement() {
		$('#budgetStatement').html(function(index, oldHtml) {
			var income = planner.totalIncome(),
				planned = planner.totalPlanned();


			if (planned === 0) {
				return Mustache.render('<h4>You&rsquo;ve not budgeted any of your income. Start below!</h4>', income);
			} else if (planned < income) {
				return Mustache.render('<h4>You&rsquo;ve budgeted <span id="managedFigure" class="managed figure">{{planned}}</span>, but you still have <span id="unmanagedFigure" class="unmanaged figure">{{unplanned}}</span> left to budget</h4>', {income: income, planned: planned, unplanned: income - planned});
			} else if (planned > income){
				return Mustache.render('<h4>Oops, looks like you&rsquo;re running short of money this month. You&rsquo;re <span class="unmanaged figure">{{over}}</span> over your income. Try adjusting your budget, or <a href="#">maybe take a loan from yourself</a></h4>.', {over: planned - income});
			} else {
				return "<h4>Great! Your budget is fully balanced, now comes the hard part. <em>Stick to it!</em></h4>";
			}
		});
	}

	updateStatement();

	$(document).on('scroll', function(e) {
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
	});

	$('#changeMonthPrevious').click(function(e) {
		var monthDescriptionEl = $('#monthDescription'),
			monthTag = monthDescriptionEl.data('month'),
			monthSegments = monthTag.split('/'),
			monthNumber = parseInt(monthSegments[0]),
			yearNumber = parseInt(monthSegments[1]);

		monthNumber--;
		if (monthNumber === 0) {
			yearNumber--;
			monthNumber = 12;
		}

		monthDescriptionEl.data('month', [monthNumber,yearNumber].join('/'));
		updateDateFromData(monthDescriptionEl);
	});

	$('#changeMonthNext').click(function(e) {
		var monthDescriptionEl = $('#monthDescription'),
			monthTag = monthDescriptionEl.data('month'),
			monthSegments = monthTag.split('/'),
			monthNumber = parseInt(monthSegments[0]),
			yearNumber = parseInt(monthSegments[1]);

		monthNumber++;
		if (monthNumber === 13) {
			yearNumber++;
			monthNumber = 1;
		}

		monthDescriptionEl.data('month', [monthNumber,yearNumber].join('/'));
		updateDateFromData(monthDescriptionEl);
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
		var template = '<tr class="item">' +
			'<td class="purse span6">{{head}}</td>' +
			'<td class="value span2">{{value}}</td>' +
		'</tr>';

		var newItemHtml = Mustache.render(template, formValue);

		$(newItemHtml).appendTo("#budget");

		// clear up everything and reset focus to original
		$(':input[type="text"]', $(e.target)).val("").first().focus();

		updateStatement();

		return false;
	});

	$('#changeIncome').click(function() {
		var template = '<form id="editableIncomeArea" class="form form-inline" action="">' +
				'<h3>Change income to '+
					'<input id="incomeInput" type="text" class="income figure" value="{{.}}"></input>&nbsp;' +
					'<button id="finishIncomeEditing" class="btn" type="submit">Change!</button>'+
				'</h3>'+
			'</form>';

		var $incomeArea = $('#incomeArea');
		$incomeArea.css('display', 'none');

		var elem = $(Mustache.render(template, planner.totalIncome())).insertAfter($incomeArea);

		$('#incomeInput').focus();

		$('#finishIncomeEditing').click(function() {
			var newIncome = $('#incomeInput').val();
			planner.setIncome(newIncome);
			$('#income').text(planner.totalIncome());
			$incomeArea.css('display', '');
			elem.remove();
			$('#headInput').focus();
			updateStatement();
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