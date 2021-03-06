angular.module('ngStripePayments').directive('stripeForm', ['$window', '$parse', 'Common', function($window, $parse, Common) {
    "use strict";
	// directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
	// and then passes that to callback provided in stripeForm, attribute.

	// data that is sent to stripe is filtered from scope, looking for valid values to
	// send and converting camelCase to snake_case, e.g expMonth -> exp_month


	// filter valid stripe-values from scope and convert them from camelCase to snake_case
	var _getDataToSend = function(data) {

		var possibleKeys = ['number', 'expMonth', 'expYear',
							'cvc', 'name','addressLine1',
							'addressLine2', 'addressCity',
							'addressState', 'addressZip',
							'addressCountry'];

		var camelToSnake = function(str) {
			return str.replace(/([A-Z])/g, function(m) {
				return "_"+m.toLowerCase();
			});
		};

		var ret = {};

		for(var i in possibleKeys) {
			if(possibleKeys.hasOwnProperty(i)){
				ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);
			}
		}

		ret.number = (ret.number || '').replace(/ /g,'');

		return ret;
	};

	return {
		restrict: 'A',
		link: function(scope, elem, attr) {

			if(!$window.Stripe){
				throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
			}

			var form = angular.element(elem);

			form.bind('submit', function() {
				scope.$emit('stripe-submitting');

				var expMonthUsed = scope.expMonth ? true : false;
				var expYearUsed = scope.expYear ? true : false;

				if(!(expMonthUsed && expYearUsed)) {
					var exp = Common.parseExpiry(scope.expiry);
					scope.expMonth = exp.month;
					scope.expYear = exp.year;
				}

				var button = form.find('button');
				button.prop('disabled', true);

				if(form.hasClass('ng-valid')) {
					$window.Stripe.createToken(_getDataToSend(scope), function() {
						var args = arguments;
						scope.$apply(function() {
							scope[attr.stripeForm].apply(scope, args);
						});
						button.prop('disabled', false);
					});
				} else {
					scope.$apply(function() {
						scope[attr.stripeForm].apply(scope, [400, {error: 'Invalid form submitted.'}]);
					});
					button.prop('disabled', false);
				}

				scope.expiryMonth = null;
				scope.expiryYear = null;
			});
		}
	};
}]);
