var DFT = function ($) {

    var bindClick = function () {
        $(document).on("click", "#new-question", function (e) {
            $('#form-survey').modal('show');
        });
        $(document).on('click', '.btn-remove', function () {
            var id = $(this).attr('data-id');
            console.log('id', id);
            if(id){
                swal({
                    title: 'Thông báo',
                    text: 'Xác nhận xóa câu hỏi khảo sát?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Có, chắc chắn !",
                    closeOnConfirm: false
                },function(){
                    _AjaxObject('survey-question/' + id, 'DELETE', {}, function (resp) {
                        if(resp.code == 200){
                            swal({
                                title: 'Thông báo !', 
                                type: 'success',
                                text: 'Xóa câu hỏi thành công!'
                            }, function(){
                                _.LoadPage(window.location.hash);
                            });
                        }
                        else{
                            swal({title: 'Thông báo !', text: resp.message});
                        }
                    })
                })
            }
            else{
                swal({title: 'Thông báo !', text: 'Câu hỏi khảo sát không tồn tại'});
            }
        })
    };

    var bindSubmit = function () {
        // Xác nhận cập nhật dữ liệu
        $('#form-edit').validationEngine('attach', {
            validateNonVisibleFields: true, autoPositionUpdate: true,validationEventTrigger:'keyup',
            onValidationComplete: function (form, status) {
                if (status) {
                    _AjaxObject(window.location.hash.replace('#','').replace('/edit', ''), 'PUT', form.getData(), function (resp) {
                        if (_.isEqual(resp.code, 200)) {
                            window.location.hash = 'surveys';
                        } else {
                            swal({title: 'Thông báo !', text: resp.message});
                        }
                    });
                }
            }
        });

        // Xác nhận tạo mới question
        $('#create-question').validationEngine('attach', {
            validateNonVisibleFields: true, autoPositionUpdate: true,
            onValidationComplete: function (form, status) {
                form.on('submit', function (e) {
                    e.preventDefault();
                });
                if (status) {
                    _AjaxObject('/survey-question', 'POST', form.getData(), function (resp) {
                        if (_.isEqual(resp.code, 200)) {
                            swal({
                                title: 'Thông báo !', 
                                type: 'success',
                                text: 'Tạo câu hỏi thành công!'
                            }, function(){
                                _.LoadPage(window.location.hash);
                            });
                        } else {
                            swal({title: 'Thông báo !', text: resp.message});
                        }
                    });
                }
            }
        });


    };

    return {
        init: function () {
            $('#script').summernote();
            // Cấu hình validation
            $.validationEngineLanguage.allRules['SurveyCheck'] = {
                "url": "/surveys/validate",
                "extraData": "",
                "extraDataDynamic": ['#name', '#updateId'],
                "alertText": "* Đã tồn tại nhóm này",
                "alertTextLoad": "<i class='fa fa-spinner fa-pulse m-r-5'></i> Đang kiểm tra, vui lòng đợi."
            };
            bindClick();
            bindSubmit();
        },
        uncut: function(){
            // Disable sự kiện khi đóng trang
            $('#form-edit').validationEngine('detach');
        }
    };
}(jQuery);