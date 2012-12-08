/* Events Generated:
		purses-month-changed
		purses-income-changed
		purses-add-purse
		purses-delete-purse
*/

var Purses = function() {
	this.commonPrefix = "mt.purses";
	var currentMonthString = this._currentMonthString();

	if (localStorage.hasOwnProperty(this.commonPrefix))
		this.loadData();
	else {
		this.data = {
			currentMonth: currentMonthString,
			months: [{
				monthString: currentMonthString,
				income: 0,
				purses: [],
				totalPlanned: 0
			}],
			overallPurseValues: {},
			originalMonth: currentMonthString
		};
		this.saveData();
	}
};

(function() {

	this.cleanAllData = function() {
		localStorage.removeItem('mt.purses');
	};

	this.saveData = function() {
		localStorage.setItem(this.commonPrefix, JSON.stringify(this.data));
	};

	this.loadData = function() {
		this.data = JSON.parse(localStorage.getItem(this.commonPrefix));
	};

	/**
		Add Month
		Requires monthString to be in a mm/yyyy format
	*/
	this.addPlannedMonth = function(monthString) {
		var dt = this.data.months,
			hasMonth = false;

		for (var i = dt.length-1; i>=0; i--) {
			if (dt[i].monthString === monthString) {
				return false;
			}
		}

		dt.push({
			monthString: monthString,
			income: 0,
			purses: [],
			totalPlanned: 0
		});

		this.saveData();
		return true;
	};

	this.setMonthIfNotSet = function(monthString) {
		if (!this.data.currentMonth) this.setMonth(monthString);
	};

	this._currentMonthString = function() {
		// set this month as current month
			var date = new Date();
			var month = date.getMonth()+1;
			var year = date.getFullYear();

			return [month,year].join('/');
	};

	this.currentMonth = function currentMonth() {
		return this.data.currentMonth;
	};

	/* setMonth
		Will set the current month, generates a month-changed event
		when the month is changed
	*/
	this.setMonth = function (monthString) {
		if (!monthString) {
			monthString = this._currentMonthString();
		}

		var prev = this.data.currentMonth;
		if (prev !== monthString) {
			this.data.currentMonth = monthString;
			this.addPlannedMonth(monthString);
		}
		// call update for everything
		this.emit('purses-month-changed', {
			previousMonth: prev,
			newMonth: monthString
		});
	};

	this.getMonthData = function getMonthData(monthString) {
		var dt = this.data.months,
			result;

		for (var i = dt.length-1; i>=0; i--) {
			var obj = dt[i];
			if (obj.monthString === monthString) {
				return obj;
			}
		}

		return null;
	};

	this.getCurrentMonthData = function getCurrentMonthData() {
		if (!this.currentMonthObject || this.currentMonth() !== this.currentMonthObject.monthString) {
			this.setMonthIfNotSet();

			this.currentMonthObject = this.getMonthData(this.data.currentMonth);
		}

		return this.currentMonthObject;
	};

	this.setIncome = function setIncome(i) {
		var pi = parseFloat(i);

		if (!!i && !isNaN(pi) && pi > 0) {
			var currentMonth = this.getCurrentMonthData();
			var oldIncome = currentMonth.income;
			currentMonth.income = pi;
			this.emit('purses-income-changed', {oldIncome: oldIncome, newIncome: pi});
			this.saveData();
		}
	};

	this.emit = function(type, data) {
		PubSub.publish(type, data);
	};

	this.validateNewPurse = function validateNewPurse(head, value, resultObject) {
		// two parts
		// Don't allow similar purses
		// Value has to be a positive number
		var hasResultObject = false;
		hasResultObject = !!resultObject;
		var res = true;

		if (isNaN(parseFloat(value))) {
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

	this._generateUniqueId = function _generateUniqueId() {
		var time = new Date().getUTCMilliseconds();
		
		while(time === this._lastId) time = (new Date()).getUTCMilliseconds();

		this._lastId = time;
		return time;
	};

	this.addPurse = function addPurse(head, value) {
		if (this.validateNewPurse(head, value)) {
			var monthObject = this.getCurrentMonthData();

			var purseObject = {
				id: this._generateUniqueId(),
				head: head,
				value: parseFloat(value)
			};

			monthObject.purses.push(purseObject);
			monthObject.totalPlanned = monthObject.totalPlanned + purseObject.value;

			this.emit('purses-add-purse', purseObject);
			this.saveData();
		}
	};

	this.removePurse = function removePurse(id) {
		var monthObject = this.getCurrentMonthData(),
			purses = monthObject.purses,
			numPurses = purses.length,
			deletedPurse = null;

		if (typeof(id) === 'string') id = parseInt(id,10);

		for (var i = numPurses-1; i>= 0; i--) {
			var purse = purses[i];
			if (purse.id === id) {
				deletedPurse = purses.splice(i, 1);
				break;
			}
		}

		if (deletedPurse && deletedPurse.length === 1) {
			deletedPurse = deletedPurse[0];
			monthObject.totalPlanned = monthObject.totalPlanned - deletedPurse.value;
			this.emit('purses-delete-purse', deletedPurse);
			this.saveData();
		}
	};

	this.editPurse = function editPurse(id, newHead, newValue) {

	};

	this.removeAllPursesForMonth = function removeAllPursesForMonth(month) {
		var data = this.getMonthData(month);

		if (!data) return;

		data.purses = [];
		data.totalPlanned = 0;
		this.saveData();

		this.emit('purses-refresh-month');
	};

	this.removeAllPursesForCurrentMonth = function removeAllPursesForCurrentMonth() {
		this.removeAllPursesForMonth(this.currentMonth());
	};

	this.income = function income() {
		return this.getCurrentMonthData().income;
	};

	this.totalPlanned = function totalPlanned() {
		return this.getCurrentMonthData().totalPlanned;
	};

	this.purses = function purses() {
		return this.getCurrentMonthData().purses;
	};

}).call(Purses.prototype);