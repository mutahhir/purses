

var BudgetPlanner = function(income) {
	this.income = income;
	this.purses = [];
};


(function() {

	this.setIncome = function setIncome(i) {
		var pi = parseFloat(i);

		if (!!i && !isNaN(pi) && pi > 0) {
			this.income = pi;
		}
	};

	this.validateNewPurse = function validateNewPurse(head, value, resultObject) {
		// two parts
		// Don't allow similar purses
		// Value has to be a positive number
		var hasResultObject = false;
		hasResultObject = !!resultObject;
		var res = true;

		if (isNaN(parseFloat(value))) {
			// 
			if (hasResultObject)
				resultObject.push({
					which: 'value',
					message: 'You need to enter a valid amount to budget'
				});
			res = false;
		}

		if (parseFloat(value) <= 0) {
			if (hasResultObject)
				resultObject.push({
					which: 'value',
					message: 'You wish someone would pay you for that but, alas! Budgeted amount has to be positive'
				});
			res = false;
		}

		if (!head || head.length === 0) {
			if (hasResultObject)
				resultObject.push({
					which: 'head',
					message: 'Please label the budgeted amount for future reference.'
				});

			res = false;
		}

		if (_.contains(_.pluck(this.purses, 'head'), head)) {
			if (hasResultObject)
				resultObject.push({
					which: 'head',
					message: 'This item is already budgeted for. Click that entry above to edit.'
				});

			res = false;
		}

		return res;
	};

	this.addPurse = function addPurse(head, value) {
		this.purses.push({
			head: head,
			value: parseFloat(value)
		});
	};

	this.totalIncome = function totalIncome() {
		return this.income;
	};

	this.totalPlanned = function totalPlanned() {
		return _.reduce(this.purses, function(a,b) {
			return a + b.value;
		}, 0);
	};


}).call(BudgetPlanner.prototype);