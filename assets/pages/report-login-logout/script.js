var DFT = function ($) {
  function bindClick() {
    $('#export_excel_total').on('click', function (e) {
			getFilter(true, 'total');
		});
    $('#search_data').on('click', function () {
			getFilter();
			// fetchDataChart();
		});
    $('#export_excel_by_time').on('click', function (e) {
			getFilter(true, 'by-day');
		});
  }

  // Lấy dữ liệu
	function getFilter(exportExcel, exportExcelType) {
		var filter = {};

		var filter = _.chain($('.input')).reduce(function (memo, input) {
			if (!_.isEqual($(input).val(), '') && !_.isEqual($(input).val(), null)) {
				memo[input.name] = $(input).val();
			}
			return memo;
		}, {}).value();

		if (!exportExcel) {
			$('#table_total').empty();
			$('#table_by_day').empty();
		}

		if (exportExcel) filter.exportExcel = true;
		if (exportExcelType) filter.exportExcelType = exportExcelType;
    console.log('filter', filter);
		_Ajax('/report-login-logout?' + $.param(filter), 'GET', [], function (resp) {
			console.log('resp',resp);

			if (!resp || resp.code == 500) {
				return swal({ title: 'Cảnh báo!', text: resp.error ? resp.error : 'Có lỗi xảy ra!' });
			}

			// if (!exportExcel && resp.code == 200) {
			// 	loadDataTotal(resp.data.reportTotal, resp.data.daysNumber);
			// 	loadDataByDay(resp.data.reportPerDay);
			// 	return;
			// }

			// if (exportExcel && resp.code == 200) {
			// 	return downloadFromUrl(resp.linkFile);
			// }
		});
	};

  function bindTextValue() {
		_.each(_.allKeys(_config.MESSAGE.REPORT_LOGIN_LOGOUT), function (item) {
			$('.' + item).html(_config.MESSAGE.REPORT_LOGIN_LOGOUT[item]);
		});
	};

  return {
    init: function () {
      bindClick();
      bindTextValue();

      // Config google chart
			google.charts.load("current", { packages: ["timeline"], 'language': 'vi' });

			$('.multi-date-picker').datepicker({
				multidate: 2,
				multidateSeparator: ' - ',
				format: 'dd/mm/yyyy',
				todayHighlight: true
			});
    },
    uncut: function () {
			$(document).off('click', '#exportexcel');
		}
  }
}(jQuery);