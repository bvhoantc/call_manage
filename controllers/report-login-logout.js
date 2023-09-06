exports.index = {
	json: async function (req, res) {
    try {
      const {
				dateTime,
				agents,
				exportExcel,
				type,
			} = req.query;
			let queryApi = {};

			if (!dateTime) throw new Error('Trường thời gian là bắt buộc!');

      let startTime = _moment(dateTime.split(' - ')[0], 'DD-MM-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
			let endTime = dateTime.split(' - ')[1] ? moment(dateTime.split(' - ')[1], 'DD-MM-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss') : moment(dateTime.split(' - ')[0], 'DD-MM-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

			if (!startTime || !endTime) throw new Error('Ngày bắt đầu và ngày kết thúc là bắt buộc!');
      queryApi.startTime = {$gte: _moment(startTime).toDate()}
      queryApi.endTime = {$lte: _moment(endTime).toDate()}
      let agg = bindAgg(type, agents, queryApi)
      _Users.aggregate(agg, function(err, result){
        if(err) res.json({ code: 500,message: err.message || err })
        else{
          res.json({
            code: 200,
            data: result
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

function bindAgg (type, agents, queryApi) {
  try {
    let agg = []
    if(agents) agg.push({$match: {_id: {$in: _.arrayObjectId(agents)} }})
      agg.push(
        { $lookup: { from: 'agentstatuslogs', localField: '_id', foreignField: 'agentId', as: 'agentstatuslogs' } },
        { $unwind: {path: '$agentstatuslogs', preserveNullAndEmptyArrays: true}},
        { $project: {
            _id: 1,
            startTime: "$agentstatuslogs.startTime",
            endTime: "$agentstatuslogs.endTime",
            status: "$agentstatuslogs.status",
            endReason: "$agentstatuslogs.endReason",
            displayName: 1
        }},
        {$match: {endReason: "logout"}},
        {$match: queryApi},
      )
      if(type == 'by-day'){
        agg.push(
          { $project: {
            _id: 1,
            startTime: 1,
            endTime: 1,
            displayName: 1,
            date: { $dateToString: { format: "%d-%m-%Y", date: "$startTime" } },
            status: 1
          }},
          {$group: {
            _id: {id: "$_id", date: "$date"},
            totalDuration: {$sum: {$subtract: ["$endTime", "$startTime"]}},
            avgDuration: {$avg: {$subtract: ["$endTime", "$startTime"]}},
            status: {$push: {
              startTime: "$startTime",
              endTime: "$endTime",
              event: "$status",
            }},
            displayName: {$first: "$displayName"},
            LoginDateTime: {$first: "$startTime"},
            LogoutDateTime: {$last: "$endTime"},
          }}
        )
      }
      else{
        agg.push(
          { $group: {
            _id: "$_id",
            displayName: {$first: "$displayName"},
            LoginDateTime: {$first: "$startTime"},
            LogoutDateTime: {$last: "$endTime"},
            status: {$push: {
              startTime: "$startTime",
              endTime: "$endTime",
              event: "$status",
            }},
            totalDuration: {$sum: {$subtract: ["$endTime", "$startTime"]}},
            avgDuration: {$avg: {$subtract: ["$endTime", "$startTime"]}},
          }}
        )
      }
    return agg;
  } catch (error) {
    console.log('errr', error);
  }
}
