const express = require('express');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
var moment = require('moment');
require('moment-timezone');
var fs = require('fs');
var sf = require('sf'); // String formatting library for node.js

moment.tz.setDefault('Asia/Seoul');

const apiRouter = express.Router();

app.use(logger('dev', {}));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use('/api', apiRouter);

function MakeNewUserData(json_user_data, user_id) {
    json_user_data[user_id] = {
        alias: '',
        corps: '',
        allergy_show: '',
        date_to_join_the_army: '',
        discharge_date: '',

        jjambot_join_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        usage_count: {
            total: 0,
            menu_api: 0,
            all_corps_menu_api: 0,
            allergy_onoff_api: 0,
            change_corps_api: 0,
            change_join_army_date: 0,
            change_discharge_date: 0,
            calculate_date: 0,
        },
    };

    var new_user_data = json_user_data;

    fs.writeFileSync('./user_data/user_data.txt', JSON.stringify(new_user_data), 'utf8'); // 동기적 파일 쓰기
    console.log('(동기적 파일 쓰기 완료) 사용자 정보가 없어 새로 추가하였습니다.');
}

function UsageCount(json_user_data, user_id, api_name) {
    json_user_data[user_id]['usage_count']['total']++;
    json_user_data[user_id]['usage_count'][api_name]++;

    var new_user_data = json_user_data;

    fs.writeFileSync('./user_data/user_data.txt', JSON.stringify(new_user_data), 'utf8'); // 동기적 파일 쓰기
    console.log('(동기적 파일 쓰기 완료) usage_count를 +1 하였습니다.');
}

apiRouter.post('/sayHello', function (req, res) {
    const responseBody = {
        version: '2.0',
        template: {
            outputs: [
                {
                    simpleText: {
                        text: "hello I'm Ryan",
                    },
                },
            ],
        },
    };

    res.status(200).send(responseBody);
});

apiRouter.post('/showHello', function (req, res) {
    console.log(req.body);

    const responseBody = {
        version: '2.0',
        template: {
            outputs: [
                {
                    simpleImage: {
                        imageUrl:
                            'https://t1.daumcdn.net/friends/prod/category/M001_friends_ryan2.jpg',
                        altText: "hello I'm Ryan",
                    },
                },
            ],
        },
    };

    res.status(200).send(responseBody);
});

apiRouter.post('/datatest', function (req, res) {
    const responseBody = {
        version: '2.0',
        data: {
            msg: 'HI',
            name: 'Ryan',
            position: 'Senior Managing Director',
        },
    };

    res.status(200).send(responseBody);
});

apiRouter.post('/crawling_test', function (req, res) {
    // 사용자 발화 즉시 크롤링 하는 방법
    console.log(req.body);

    const convert = require('xml-js'); // npm install xml-js request

    const request = require('request');

    var module_api_key = require('./api_key');
    const HOST = module_api_key.HOST;
    const KEY = module_api_key.KEY;
    const TYPE = module_api_key.TYPE;
    const SERVICE = module_api_key.SERVICE;
    const START_INDEX = module_api_key.START_INDEX;
    const END_INDEX = module_api_key.END_INDEX;

    var requestUrl = `${HOST}/${KEY}/${TYPE}/${SERVICE}/${START_INDEX}/${END_INDEX}`;

    var xmlToJson;
    var response_menu = 'init';
    var jsonData;
    var isCrawlingFinished = false;

    request.get(requestUrl, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`);
        } else {
            if (res.statusCode == 200) {
                var result = body;

                // console.log(`body data => ${result}`)

                xmlToJson = convert.xml2json(result, { compact: true, spaces: 4 }); // compact(데이터 간소화 여부), spaces(들여쓰기 포인트)

                console.log(`xmlToJson 타입 => ${typeof xmlToJson}`);

                // console.log(`xml to json => ${xmlToJson}`)

                jsonData = JSON.parse(xmlToJson);
                console.log(`jsonData 타입 => ${typeof jsonData}`);

                response_menu = jsonData.DS_TB_MNDT_DATEBYMLSVC_5322.row[0];
                console.log(`response_menu 타입 => ${typeof response_menu}`);

                console.log(`json 출력값 => ${JSON.stringify(response_menu)}`);

                isCrawlingFinished = true;
            }
        }
    });
    console.log('1');
    while (true) {
        console.log('2');

        if ((isCrawlingFinished = true)) {
            console.log('3');

            console.log('===========');
            console.log(`json 출력값 => ${JSON.stringify(response_menu)}`);
            console.log('===========');

            const responseBody = {
                version: '2.0',
                data: {
                    msg: 'HI',
                    name: 'Ryan',
                    position: 'Senior Managing Director',
                    menu: response_menu,
                },
            };

            res.status(200).send(responseBody);
            console.log('4');

            break;
            console.log('5');
        }
    }

    // setTimeout(function() {

    // }, 1000);
});

apiRouter.post('/menu', function (req, res) {
    console.log('\n<req.body 출력> ');
    console.log(req.body);
    console.log('moment:', moment().format('YYYY-MM-DD HH:mm:ss'));

    var today_date = moment().format('YYYY-MM-DD');
    console.log('today_date:', today_date);
    console.log(`today_date 타입 => ${typeof today_date}`);

    var request_date = JSON.parse(req.body.action.params.sys_date).date;

    if (request_date == 'null') {
        request_date = today_date;
    }

    console.log('request_date:', request_date);
    console.log(`request_date 타입 => ${typeof request_date}`);

    var user_id = req.body.userRequest.user.id;

    console.log('user_id:', user_id);
    console.log(`user_id 타입 => ${typeof user_id}`);

    var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기

    user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
    var json_user_data = JSON.parse(user_data);

    if (json_user_data[user_id] == undefined) {
        // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가해서 다시 읽기
        MakeNewUserData(json_user_data, user_id);
    }

    var request_corps = json_user_data[user_id]['corps'];
    var allergyInfo = json_user_data[user_id]['allergy_show'];

    console.log('request_corps:', request_corps);
    console.log(`request_corps 타입 => ${typeof request_corps}`);

    console.log('allergyInfo:', allergyInfo);
    console.log(`allergyInfo 타입 => ${typeof allergyInfo}`);

    var fileDi =
        './crawler/data/crawling_data/sort_menuData/' +
        request_corps +
        '/year_' +
        request_date.substring(0, 4) +
        '/month_' +
        request_date.substring(5, 7) +
        '/' +
        request_date.substring(0, 4) +
        '_' +
        request_date.substring(5, 7) +
        '_menu.txt';
    console.log('fileDi:', fileDi);
    console.log(`fileDi 타입 => ${typeof fileDi}`);

    fs.readFile(fileDi, 'utf8', function (err, menu_data) {
        if (request_corps != '') {
            // 급양대가 등록되어있을때

            var response_menu = 'init';
            var response_date = 'init';
            var msg = '';

            var weekday = new Array(
                '일요일',
                '월요일',
                '화요일',
                '수요일',
                '목요일',
                '금요일',
                '토요일'
            );
            var today_name = new Date(request_date).getDay();
            var todayLabel = weekday[today_name];

            response_date = request_date + '-' + todayLabel;
            console.log('response_date:', response_date);

            try {
                menu_data = menu_data.replace(/\'/gi, '"'); // '를 "로 모두 전환

                if (allergyInfo == 'off' || allergyInfo == '') {
                    // 알러지 정보 표시가 "off"이거나 ""일때
                    menu_data = menu_data.replace(/\([0-9]\)/gi, ''); // (1자리수)를 공백으로 변환
                    menu_data = menu_data.replace(/\([0-9][0-9]\)/gi, ''); // (2자리수)를 공백으로 변환

                    // 		배추김치(3~4월)에서 (3~4월)제거하기
                    menu_data = menu_data.replace(/\([0-9]~[0-9]월\)/gi, '');
                    menu_data = menu_data.replace(/\([0-9]~[0-9][0-9]월\)/gi, '');
                    menu_data = menu_data.replace(/\([0-9][0-9]~[0-9][0-9]월\)/gi, '');
                }

                var menuJson = JSON.parse(menu_data);

                var date_code = request_date.replace(/-/gi, '');
                console.log('date_code:', date_code);

                response_menu = menuJson[request_corps][date_code];

                // console.log(response_menu);

                function listToString(dic, key) {
                    var str = '';

                    for (var i = 0; i < dic[key].length; i++) {
                        str += dic[key][i].trim(); //trim()을 이용해 앞뒤 공백 제거

                        if (i < dic[key].length - 1) {
                            str += ', ';
                        }
                    }
                    return str;
                }

                try {
                    var menu_breakfast = '[아침]\n' + listToString(response_menu, 'breakfast');
                    var menu_lunch = '[점심]\n' + listToString(response_menu, 'lunch');
                    var menu_dinner = '[저녁]\n' + listToString(response_menu, 'dinner');
                    var menu_specialFood = '[부식]\n' + listToString(response_menu, 'specialFood');
                } catch (e) {
                    var menu_breakfast = '[아침]\n' + '식단 정보가 등록되지 않았습니다.';
                    var menu_lunch = '[점심]\n' + '식단 정보가 등록되지 않았습니다.';
                    var menu_dinner = '[저녁]\n' + '식단 정보가 등록되지 않았습니다.';
                    var menu_specialFood = '[부식]\n' + '식단 정보가 등록되지 않았습니다.';
                    console.log(e); // pass exception object to error handler
                }
            } catch (e) {
                var menu_breakfast = '[아침]\n' + '식단 정보가 등록되지 않았습니다.';
                var menu_lunch = '[점심]\n' + '식단 정보가 등록되지 않았습니다.';
                var menu_dinner = '[저녁]\n' + '식단 정보가 등록되지 않았습니다.';
                var menu_specialFood = '[부식]\n' + '식단 정보가 등록되지 않았습니다.';
                msg = '\n\n국방부에서 식단 등록을 하지 않은 경우 이용에 제한이 있을 수 있습니다.';
                console.log('에러 처리2'); // pass exception object to error handler
                console.log(e); // pass exception object to error handler
            }

            var request_meal_type_list = [];

            if (req.body.action.params['meal_type0'] != undefined) {
                request_meal_type_list.push(req.body.action.params['meal_type0']);
            }

            if (req.body.action.params['meal_type1'] != undefined) {
                request_meal_type_list.push(req.body.action.params['meal_type1']);
            }
            if (req.body.action.params['meal_type2'] != undefined) {
                request_meal_type_list.push(req.body.action.params['meal_type2']);
            }
            if (req.body.action.params['meal_type3'] != undefined) {
                request_meal_type_list.push(req.body.action.params['meal_type3']);
            }

            console.log('request_meal_type_list:', request_meal_type_list);
            console.log(`request_meal_type_list 타입 => ${typeof request_meal_type_list}`);
            console.log('request_meal_type_list 갯수:', request_meal_type_list.length);

            function contains(l, obj) {
                for (var i = 0; i < l.length; i++) {
                    if (l[i] === obj) {
                        return true;
                    }
                }
                return false;
            }

            var response_meal =
                '오류가 발생하였습니다.[errorcode: nurm0411]\n상담원과의 대화를 통해 문의 바랍니다.';

            if (JSON.stringify(request_meal_type_list) == JSON.stringify(['all'])) {
                response_meal =
                    menu_breakfast +
                    '\n\n' +
                    menu_lunch +
                    '\n\n' +
                    menu_dinner +
                    '\n\n' +
                    menu_specialFood;
            } else {
                response_meal = '';
                if (contains(request_meal_type_list, '아침')) {
                    response_meal += menu_breakfast + '\n';
                }
                if (contains(request_meal_type_list, '점심')) {
                    response_meal += '\n' + menu_lunch + '\n';
                }
                if (contains(request_meal_type_list, '저녁')) {
                    response_meal += '\n' + menu_dinner + '\n';
                }
                if (contains(request_meal_type_list, '부식')) {
                    response_meal += '\n' + menu_specialFood;
                } else {
                    response_meal += '\n' + menu_specialFood;
                }
            }

            var response_corps;
            if (request_corps == 'ATC') {
                response_corps = '육훈소';
            } else {
                response_corps = request_corps + '부대';
            }

            const responseBody = {
                version: '2.0',
                data: {
                    meal: response_meal,

                    date: response_date,
                    corps: '(' + response_corps + ' 식단)',

                    breakfast: menu_breakfast,
                    lunch: menu_lunch,
                    dinner: menu_dinner,
                    specialFood: menu_specialFood,
                    msg: msg,
                },
            };
            res.status(200).send(responseBody);
        } else {
            console.log('부대 설정이 되어있지 않아 부대 설정 안내 메시지를 전송했습니다.');
            const responseBody = {
                version: '2.0',
                data: {
                    msg:
                        '식단을 호출하기 전에 우선 부대 설정을 해주세요.\n\n짬봇에게 "부대 설정하기"라고 입력해주세요~',
                },
            };

            res.status(200).send(responseBody);
        }

        UsageCount(json_user_data, user_id, 'menu_api');
    });
});

apiRouter.post('/all_corps_menu', function (req, res) {
    console.log('\n<req.body 출력> ');
    console.log(req.body);

    fs.readFile('./crawler/data/crawling_data/allCorpsMenu.txt', 'utf8', function (err, menu_data) {
        var today_date = moment().format('YYYY-MM-DD');
        console.log('today_date:', today_date);
        console.log(`today_date 타입 => ${typeof today_date}`);

        var request_date = JSON.parse(req.body.action.params.sys_date).date;

        if (request_date == 'null') {
            request_date = today_date;
        }

        console.log('request_date:', request_date);
        console.log(`request_date 타입 => ${typeof request_date}`);

        var user_id = req.body.userRequest.user.id;

        var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기

        user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
        var json_user_data = JSON.parse(user_data);

        if (json_user_data[user_id] == undefined) {
            // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가하기(폼만 추가, 데이터는 없음.)
            MakeNewUserData(json_user_data, user_id);
        }

        menu_data = menu_data.replace(/\'/gi, '"'); // '를 "로 모두 전환

        // 알러지 정보 감추기
        menu_data = menu_data.replace(/\([0-9]\)/gi, ''); // (1자리수)를 공백으로 변환
        menu_data = menu_data.replace(/\([0-9][0-9]\)/gi, ''); // (2자리수)를 공백으로 변환

        // 배추김치(3~4월)에서 (3~4월)제거하기
        menu_data = menu_data.replace(/\([0-9]~[0-9]월\)/gi, '');
        menu_data = menu_data.replace(/\([0-9]~[0-9][0-9]월\)/gi, '');
        menu_data = menu_data.replace(/\([0-9][0-9]~[0-9][0-9]월\)/gi, '');

        menu_data = menu_data.replace(/\(임가공\)/gi, '');

        var menuJson = JSON.parse(menu_data);
        var allergyInfo = 'off';
        var corps_list = Object.keys(menuJson);
        var response_string_dic = {};

        for (var i = 0; i < corps_list.length; i++) {
            var request_corps = corps_list[i];

            console.log('request_corps:', request_corps);
            console.log(`request_corps 타입 => ${typeof request_corps}`);

            var response_menu = 'init';
            var response_date = 'init';
            var msg = 'ok';

            var weekday = new Array(
                '일요일',
                '월요일',
                '화요일',
                '수요일',
                '목요일',
                '금요일',
                '토요일'
            );
            var today_name = new Date(request_date).getDay();
            var todayLabel = weekday[today_name];

            response_date = request_date + '-' + todayLabel;
            console.log('response_date:', response_date);

            var date_code = request_date.replace(/-/gi, '');
            console.log('date_code:', date_code);

            response_menu = menuJson[request_corps][date_code];

            // console.log(response_menu);

            function listToString(dic, key) {
                var str = '';

                for (var i = 0; i < dic[key].length; i++) {
                    str += dic[key][i].trim(); //trim()을 이용해 앞뒤 공백 제거

                    if (i < dic[key].length - 1) {
                        str += ', ';
                    }
                }
                return str;
            }

            try {
                var menu_breakfast = '[아침]\n' + listToString(response_menu, 'breakfast');
                var menu_lunch = '[점심]\n' + listToString(response_menu, 'lunch');
                var menu_dinner = '[저녁]\n' + listToString(response_menu, 'dinner');
                var menu_specialFood = '[부식]\n' + listToString(response_menu, 'specialFood');
            } catch (e) {
                var menu_breakfast = '[아침]\n' + '식단 정보가 등록되지 않았습니다.';
                var menu_lunch = '[점심]\n' + '식단 정보가 등록되지 않았습니다.';
                var menu_dinner = '[저녁]\n' + '식단 정보가 등록되지 않았습니다.';
                var menu_specialFood = '[부식]\n' + '식단 정보가 등록되지 않았습니다.';
                console.log(e); // pass exception object to error handler
            }

            var response_meal = menu_lunch;
            // menu_breakfast +
            // '\n\n' +
            // menu_lunch +
            // '\n\n' +
            // menu_dinner +
            // '\n\n' +
            // menu_specialFood;

            var response_corps;
            if (request_corps == 'ATC') {
                response_corps = '육군훈련소';
            } else {
                response_corps = request_corps + '부대';
            }

            var response_string = response_date + ' (' + response_corps + ')\n' + response_meal;
            response_string_dic[i + 1] = response_string;
        }

        const responseBody = {
            version: '2.0',
            data: response_string_dic,
        };

        console.log('<response_string_dic>');
        console.log(response_string_dic);

        UsageCount(json_user_data, user_id, 'all_corps_menu_api');

        res.status(200).send(responseBody);
    });
});

apiRouter.post('/allergy/onoff', function (req, res) {
    console.log(req.body);

    var user_id = req.body.userRequest.user.id;
    console.log('user_id:', user_id);
    console.log(`user_id 타입 => ${typeof user_id}`);

    var allergy_show = req.body.action.params['onoff'];

    console.log('allergy_show:', allergy_show);
    console.log(`allergy_show 타입 => ${typeof allergy_show}`);

    var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
    user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
    var json_user_data = JSON.parse(user_data);

    if (json_user_data[user_id] == undefined) {
        // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가하기
        MakeNewUserData(json_user_data, user_id);
    }

    fs.readFile('./user_data/user_data.txt', 'utf8', function (err, data) {
        data = data.replace(/\'/gi, '"'); // '를 "로 모두 전환

        var json_user_data = JSON.parse(data);

        json_user_data[user_id]['usage_count']['total']++;
        json_user_data[user_id]['usage_count']['allergy_onoff_api']++;
        json_user_data[user_id]['allergy_show'] = allergy_show;
        console.log('(변경한 사용자 셋팅):', json_user_data[user_id]);

        fs.writeFile('./user_data/user_data.txt', JSON.stringify(json_user_data), 'utf8', function (
            err
        ) {
            console.log(
                '(비동기적 파일 쓰기) user_data.txt에 알러지 정보 업데이트 완료, usage_count +1 완료.'
            );
        });
    });

    // 	사용자 정보에 알러지 셋팅 값을 allergy_show로 저장/갱신

    if (allergy_show == 'on') {
        var title = '알러지 정보를 나타냈습니다.';
        var description = '이제부터 메뉴에 알러지 정보가 표시됩니다.';
        var imageUrl = 'https://cdn.pixabay.com/photo/2015/03/22/17/45/on-684987_960_720.jpg';
    } else if (allergy_show == 'off') {
        var title = '알러지 정보를 숨겼습니다.';
        var description = '메뉴에 더 이상 알러지 정보가 표시되지 않습니다.';
        var imageUrl = 'https://cdn.pixabay.com/photo/2016/06/26/18/00/icon-1480925_960_720.png';
    }

    var responseBody = {
        version: '2.0',
        template: {
            outputs: [
                {
                    carousel: {
                        type: 'basicCard',
                        items: [
                            {
                                title: title,
                                description: description,
                                thumbnail: {
                                    imageUrl: imageUrl,
                                },
                                buttons: [
                                    {
                                        action: 'message',
                                        label: '알러지 정보 보기',
                                        messageText: '알러지 정보 보기',
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
    };

    res.status(200).send(responseBody);
});

apiRouter.post('/corps/change', function (req, res) {
    console.log(req.body);

    var user_id = req.body.userRequest.user.id;
    console.log('user_id:', user_id);
    console.log(`user_id 타입 => ${typeof user_id}`);

    var corps = req.body.action.params['corps_list'];

    console.log('corps:', corps);
    console.log(`corps 타입 => ${typeof corps}`);

    var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
    user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
    var json_user_data = JSON.parse(user_data);

    if (json_user_data[user_id] == undefined) {
        // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가하기
        MakeNewUserData(json_user_data, user_id);
    }

    fs.readFile('./user_data/user_data.txt', 'utf8', function (err, data) {
        data = data.replace(/\'/gi, '"'); // '를 "로 모두 전환

        var json_user_data = JSON.parse(data);

        json_user_data[user_id]['usage_count']['total']++;
        json_user_data[user_id]['usage_count']['change_corps_api']++;
        json_user_data[user_id]['corps'] = corps;
        console.log('(변경한 사용자 셋팅):', json_user_data[user_id]);

        // 	사용자 정보에 사용자 부대를 저장/갱신
        fs.writeFile('./user_data/user_data.txt', JSON.stringify(json_user_data), 'utf8', function (
            err
        ) {
            console.log('(비동기적 파일 쓰기) 부대 변경 완료, usage_count +1 완료.');
        });
    });

    if (corps == 'null') {
        var msg =
            '해당 부대를 찾지 못했습니다.\n"부대 찾아보기"를 입력해 본인의 부대를 찾아보세요.';
    } else {
        var msg = '부대를 정상적으로 설정하였습니다.\n\n[설정한 부대: ' + corps + ']';
    }
    const responseBody = {
        version: '2.0',
        data: {
            msg: msg,
        },
    };

    res.status(200).send(responseBody);
});

// 입대일 변경 시 호출
apiRouter.post('/date_to_join_the_army/change', function (req, res) {
    console.log(req.body);

    var user_id = req.body.userRequest.user.id;
    console.log('user_id:', user_id);
    console.log(`user_id 타입 => ${typeof user_id}`);

    var join_army_date = JSON.parse(req.body.action.params.sys_date).date; // 사용자가 입력한 입대일

    console.log('join_army_date:', join_army_date);
    console.log(`join_army_date 타입 => ${typeof join_army_date}`);

    var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
    user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
    var json_user_data = JSON.parse(user_data);

    if (json_user_data[user_id] == undefined) {
        // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가하기
        MakeNewUserData(json_user_data, user_id);

        // 새로 추가한 user_data.txt를 다시 불러오기
        var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
        user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
        var json_user_data = JSON.parse(user_data);
    }

    json_user_data[user_id]['usage_count']['total']++;
    json_user_data[user_id]['usage_count']['change_join_army_date']++;
    json_user_data[user_id]['date_to_join_the_army'] = join_army_date;
    console.log('(변경한 사용자 셋팅):', json_user_data[user_id]);

    fs.writeFile('./user_data/user_data.txt', JSON.stringify(json_user_data), 'utf8', function (
        err
    ) {
        console.log(
            '(비동기적 파일 쓰기) user_data.txt에 입대일 설정[변경] 완료, usage_count +1 완료.'
        );
    });

    const responseBody = {
        version: '2.0',
        data: {
            msg: '입대일을 ' + join_army_date + '로 설정[변경]하였습니다.',
        },
    };

    res.status(200).send(responseBody);
});

// 전역일 변경 시 호출
apiRouter.post('/discharge_date/change', function (req, res) {
    // 	나중에 수정사항: 전역일 설정과 입대일 설정을 합치기 (매개변수를 전역일,입대일로 설정하여 조건 분류.)
    console.log(req.body);

    var user_id = req.body.userRequest.user.id;
    console.log('user_id:', user_id);
    console.log(`user_id 타입 => ${typeof user_id}`);

    var discharge_date = JSON.parse(req.body.action.params.sys_date).date; // 사용자가 입력한 전역일

    console.log('discharge_date:', discharge_date);
    console.log(`discharge_date 타입 => ${typeof discharge_date}`);

    var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
    user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
    var json_user_data = JSON.parse(user_data);

    if (json_user_data[user_id] == undefined) {
        // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가하기
        MakeNewUserData(json_user_data, user_id);

        // 		새로 추가한 user_data.txt를 다시 불러오기
        var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
        user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
        var json_user_data = JSON.parse(user_data);
    }

    json_user_data[user_id]['usage_count']['total']++;
    json_user_data[user_id]['usage_count']['change_discharge_date']++;
    json_user_data[user_id]['discharge_date'] = discharge_date;
    console.log('(변경한 사용자 셋팅):', json_user_data[user_id]);

    fs.writeFile('./user_data/user_data.txt', JSON.stringify(json_user_data), 'utf8', function (
        err
    ) {
        console.log(
            '(비동기적 파일 쓰기) user_data.txt에 전역일 설정[변경] 완료, usage_count +1 완료.'
        );
    });

    const responseBody = {
        version: '2.0',
        data: {
            msg: '전역일을 ' + discharge_date + '로 설정[변경]하였습니다.',
        },
    };

    res.status(200).send(responseBody);
});

// 전역일 계산 시 호출
apiRouter.post('/calculate_date', function (req, res) {
    console.log(req.body);

    var user_id = req.body.userRequest.user.id;
    console.log('user_id:', user_id);
    console.log(`user_id 타입 => ${typeof user_id}`);

    var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
    user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
    var json_user_data = JSON.parse(user_data);

    if (json_user_data[user_id] == undefined) {
        // user_data.txt에 해당 사용자의 정보가 없으면 새로 추가하기
        MakeNewUserData(json_user_data, user_id);

        // 		새로 추가한 user_data.txt를 다시 불러오기
        var user_data = fs.readFileSync('./user_data/user_data.txt', 'utf8'); //동기식 파일 읽기
        user_data = user_data.replace(/\'/gi, '"'); // '를 "로 모두 전환
        var json_user_data = JSON.parse(user_data);
    }

    json_user_data[user_id]['usage_count']['total']++;
    json_user_data[user_id]['usage_count']['calculate_date']++;
    console.log('(변경한 사용자 셋팅):', json_user_data[user_id]);

    fs.writeFile('./user_data/user_data.txt', JSON.stringify(json_user_data), 'utf8', function (
        err
    ) {
        console.log('(비동기적 파일 쓰기) usage_count +1 완료.(calculate_date)');
    });

    var user_date_to_join_the_army = json_user_data[user_id]['date_to_join_the_army']; // 사용자가 설정했던 입대일 불러오기
    var user_discharge_date = json_user_data[user_id]['discharge_date']; // 사용자가 설정했던 전역일 불러오기

    if (user_date_to_join_the_army == '') {
        var date_to_join_the_army_msg =
            '입대일을 설정하지 않았습니다.\n입대일 설정을 입력하거나 아래 버튼을 통해 입대일을 먼저 설정하세요.';
        var calculate_date_simple =
            "입대일을 설정하지 않았습니다.\n'입대일 설정'을 입력하여 입대일을 먼저 설정하세요.";
        var calculate_date_detail =
            "입대일을 설정하지 않았습니다.\n'입대일 설정'을 입력하여 입대일을 먼저 설정하세요.";
    } else {
        var date_to_join_the_army_msg = '설정된 입대일은 ' + user_date_to_join_the_army + '입니다.';

        if (user_discharge_date == '') {
            var calculate_date_simple =
                "전역일을 설정하지 않았습니다.\n'전역일 설정'을 입력하여 전역일을 먼저 설정하세요.";
            var calculate_date_detail =
                "전역일을 설정하지 않았습니다.\n'전역일 설정'을 입력하여 전역일을 먼저 설정하세요.";
        } else {
            var nowday = new Date();
            var d_discharge_date = new Date(user_discharge_date); //전역일, Date로 표현하면 09시가 됨. 나중에 00시로 수정
            var d_day = d_discharge_date.getTime() - nowday.getTime();

            d_day = Math.ceil(d_day / (1000 * 60 * 60 * 24)) * -1; // Math.ceil은 소수부분을 올림함.

            if (d_day == 0) {
                //당일일때 , D-day로 변경
                d_day = '-day';
            } else if (d_day > 0) {
                d_day = '+' + d_day;
            }

            var d_date_to_join_the_army = new Date(user_date_to_join_the_army); // 입대일
            var p_day = nowday.getTime() - d_date_to_join_the_army.getTime();
            p_day = Math.floor(p_day / (1000 * 60 * 60 * 24));

            if (p_day >= 0) {
                p_day = '+' + p_day;
            }

            var total_day = d_discharge_date.getTime() - d_date_to_join_the_army.getTime(); // 총복무일 = 전역일 - 입대일
            total_day = Math.floor(total_day / (1000 * 60 * 60 * 24));

            var calculate_date_simple =
                sf('전역: D{d}일', { d: d_day }) +
                sf('\n\n복무 비율: {per}%', { per: (p_day / total_day) * 100 }) +
                sf('\n\n전역일: {d}', { d: user_discharge_date });

            var calculate_date_detail =
                sf('전역: D{d}일', { d: d_day }) +
                sf('\n현재 복무일수: D{p}일', { p: p_day }) +
                sf('\n총 복무일수: {p}일', { p: total_day }) +
                sf('\n복무 비율: {per}%', { per: ((p_day / total_day) * 100).toFixed(1) }) +
                sf('\n입대일: {d}', { d: user_date_to_join_the_army }) +
                sf('\n전역일: {d}', { d: user_discharge_date });
        }
    }

    const responseBody = {
        version: '2.0',
        data: {
            date_to_join_the_army_msg: date_to_join_the_army_msg,
            calculate_date_simple: calculate_date_simple,
            calculate_date_detail: calculate_date_detail,
        },
    };

    res.status(200).send(responseBody);
});

app.listen(5000, function () {
    console.log('jjambot menu skill server listening on port 5000!');
});
