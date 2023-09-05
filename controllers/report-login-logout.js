exports.index = {
	json: async function (req, res) {
    try {
      const {
				dateTime,
				agents,
				exportExcel,
				exportExcelType,
				type
			} = req.query;
			let queryApi = {};

			if (!dateTime) throw new Error('Trường thời gian là bắt buộc!');

      let startTime = _moment(dateTime.split(' - ')[0], 'DD-MM-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
			let endTime = dateTime.split(' - ')[1] ? moment(dateTime.split(' - ')[1], 'DD-MM-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss') : moment(dateTime.split(' - ')[0], 'DD-MM-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

			if (!startTime || !endTime) throw new Error('Ngày bắt đầu và ngày kết thúc là bắt buộc!');
      queryApi.startTime = {$gte: startTime}
      queryApi.endTime = {$lte: endTime}
      let agg = [
        { $lookup: { from: 'agentstatuslogs', localField: '_id', foreignField: 'agentId', as: 'agentstatuslogs' } },
        { $unwind: {path: '$agentstatuslogs', preserveNullAndEmptyArrays: true}},
        { $project: {
            _id: 1,
            startTime: "$agentstatuslogs.startTime",
            endTime: "$agentstatuslogs.endTime",
            status: "$agentstatuslogs.status",
            endReason: "$agentstatuslogs.endReason",
            name: 1
        }},
        {$match: {endReason: "logout"}},
      ]
      agg.push({$match: queryApi});
      agg.push(
        { $group: {
          _id: "$_id",
          loginDateTime: {$first: "$startTime"},
          userName: {$first: "$name"},
          status: {$push: {
              startTime: "$startTime",
              endTime: "$endTime",
              event: "$status",
          }},
        }}
      )
      console.log('agg', JSON.stringify(agg));
      _Users.aggregate(agg, function(err, result){
        if(err) throw new Error(err)
        else{
          console.log('result', result);
          res.json({
            code: 200
          })
        }
      })
    } catch (error) {
      res.json({
        code: 500,
        message: error.message || error
      })
    }
  },
  html: async function (req, res) {
    try {
      // Kiểm tra quyền truy cập
			if (!req.session.auth.company || !req.session.auth.company.leader) {
				throw new Error('Không đủ quyền truy cập!');
			}
      // Lấy danh sách agent
			const agentsInfoResult = await _Users.find({status: 1});

      _.render(req, res, 'report-login-logout', _.extend({
				title: 'Báo cáo Login - Logout',
        agent: agentsInfoResult,
				plugins: ['moment', ['bootstrap-select'], 'export-excel', 'google-chart'],
			}, {}), true);
    } catch (error) {
      return _.render(req, res, 'report-login-logout', null, true, error);
    }
  }
}
