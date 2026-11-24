'use strict';

(() => {
  const KB = window.TONGUE_KB;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const LETTERS = 'ABCDEFGHIJ';
  const RISK_LABEL = { normal: '正常', warning: '警示', high_alert: '高危' };
  const RISK_ORDER = { high_alert: 0, warning: 1, normal: 2 };
  const METHOD_LABEL = {
    foot_bath: '泡脚方',
    tea: '茶饮·汤剂',
    diet_therapy: '食疗方',
    patent_medicine: '中成药',
    acupoint_lifestyle: '穴位·生活',
  };
  const METHOD_ORDER = ['foot_bath', 'tea', 'diet_therapy', 'patent_medicine', 'acupoint_lifestyle'];
  const METHOD_GLYPH = {
    foot_bath: '足',
    tea: '汤',
    diet_therapy: '食',
    patent_medicine: '丸',
    acupoint_lifestyle: '穴',
  };
  const STEP_SHORT = {
    step_1_color: '舌色',
    step_2_coating: '舌苔',
    step_3_shape_stasis: '舌形血络',
    step_4_symptom_confirm: '症状合参',
  };
  const TYPE_LABEL = {
    chapter: '章节',
    constitution: '体质',
    sign: '舌象',
    remedy: '方法',
    herb: '药材',
  };
  const TAB_TITLE = {
    overview: '全书骨架',
    zones: '舌面分区',
    wizard: '照镜自查',
    atlas: '图鉴对比',
    remedies: '调理与红线',
    mastery: '传导与自测',
  };
  const SEARCH_SUGGESTIONS = ['齿痕', '玉灵膏', '孕妇', '三高', '茯苓', '早醒', '地图舌', '泡脚'];

  /* =========================================================
     1. CLINICAL RULES & CAUSAL GRAPHS (100% preserved)
     ========================================================= */
  const PRECHECK_LINKS = {
    pc_menstruation_red_tip: { options: ['opt_color_red_tip_edges'] },
    pc_congenital_deviated_tip: { options: ['opt_shape_deviated_alert'] },
    pc_pregnancy_normal_stasis: { constitutions: ['blood_stasis'] },
  };

  const STEP_MUTEX = [
    {
      when: ['opt_color_pale_tender'],
      target: 'opt_shape_red_cracks',
      pages: [80, 96, 139, 140],
      reason: '第一步已选舌色淡白浅淡（血充盈不足），与“舌质红而布满深裂纹”的红舌定义互斥；脾虚淡舌若见裂纹请选“舌体胖大……舌中深纵裂”',
    },
    {
      when: ['opt_color_pale_aged'],
      target: 'opt_shape_red_cracks',
      pages: [47, 50, 139, 150],
      reason: '第一步已选舌质很淡不红（阳虚/寒象淡白舌），与“舌质红而布满深裂纹”的红舌定义互斥',
    },
  ];

  const REMEDY_CONTRA = [
    { when: ['opt_coat_sticky_frost'], target: 'rem_sanqi_xiyangshen', pages: [121, 124], reason: '舌苔白厚腻/水液黏腻提示湿重成痰，三七西洋参粉仅限单纯瘀血无厚苔者直服，苔厚有湿须先祛湿' },
    { when: ['opt_coat_sticky_frost'], target: 'rem_liuwei_dihuang', pages: [142, 144], reason: '舌苔厚腻属体内有痰湿，严禁服用含滞腻熟地的六味地黄丸，必须先清掉痰湿' },
    { when: ['opt_color_pale_aged'], target: 'rem_liuwei_dihuang', pages: [144, 150, 151], reason: '舌质淡而不红偏苍老属阳虚指征，原书明确阳虚者不要马上补阴、禁直服六味地黄丸（应选金匮肾气丸温阳）' },
    { when: ['opt_color_pale_aged'], target: 'rem_adult_yin_bone_soup', pages: [141, 144, 150], reason: '舌质很淡不红偏苍老属阳虚体寒，原书明确“此时不要马上补阴”，不宜单用生地沙参麦冬石斛甘寒滋阴煲汤' },
    { when: ['opt_color_pale_aged'], target: 'rem_child_nourish_yin', pages: [135, 140, 144], reason: '舌质很淡不红偏苍老属阳虚有寒，原书明确“此时不要马上补阴”，不宜服用生地石斛沙参麦冬甘寒滋阴方' },
    { when: ['opt_coat_sticky_frost'], target: 'rem_adult_yin_bone_soup', pages: [161, 162], reason: '舌苔白厚腻如霜或黏腻属痰湿阻滞、“营养”过剩，原书强调先把痰湿去掉并“以清为补、坚持素食”，忌煲猪龙骨滋阴肉汤' },
    { when: ['opt_color_red_whole'], target: 'rem_jinkui_shenqi', pages: [137, 144, 150, 151, 159], reason: '全舌明显偏红或深红属体内有热（少苔/薄苔为阴虚内热，伴厚腻苔为痰湿化热），原书界定阳虚必为舌淡苔白不红，严禁误服含附子肉桂温阳之金匮肾气丸' },
    { when: ['opt_color_red_whole'], target: 'rem_fuzi_lizhong', pages: [137, 150, 153, 159], reason: '全舌明显偏红或深红属体内热象（阴虚内热或痰湿化热），非舌淡苔白之脾胃虚寒，严禁服用温热助火之附子理中丸' },
    { when: ['opt_color_red_whole', 'opt_coat_sticky_frost'], target: 'rem_buzhong_bazhen', pages: [158, 159, 200], reason: '全舌偏红伴厚腻白霜苔属“舌苔很腻、很厚，舌质红”营养过剩，原书严戒“千万不能再补身体了”，须先清痰湿，忌直服补中益气丸与八珍糕' },
    { when: ['opt_color_red_whole', 'opt_coat_sticky_frost'], target: 'rem_danggui_chicken_soup', pages: [158, 159, 162, 200], reason: '全舌偏红伴厚腻黏腻苔属“舌苔很腻、很厚，舌质红”营养过剩，原书严戒“千万不能再补身体了”并倡素食，忌喝当归养血鸡汤' },
    { when: ['opt_color_red_whole', 'opt_coat_sticky_frost'], target: 'rem_yulinggao', pages: [158, 159, 162, 200], reason: '全舌偏红伴厚腻黏腻苔属“舌苔很腻、很厚，舌质红”营养过剩，原书严戒“千万不能再补身体了”，忌服浓补气血之玉灵膏' },
    { when: ['opt_coat_thin_peeled'], target: 'rem_wendan_footbath', pages: [55, 160, 161], reason: '舌苔极薄、光剥无苔或地图舌主胃气虚或阴虚津亏（非湿聚成痰），原书强调温胆汤含温燥化痰药，仅针对湿气凝痰、吃得太好痰重者才用' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_sanqi_xiyangshen', pages: [56, 123, 124], reason: '舌苔厚腻发黄（或高热干焦发黑）属湿热痰浊或外感高热急症，非单纯瘀血无厚苔，须先祛湿清热或立即就医，忌直服含温性三七之方' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_liuwei_dihuang', pages: [137, 142, 144], reason: '舌苔厚、黄腻属体内湿热（干焦黑苔属外感高热重证，非无外感之舌红苔薄），原书明确不适合服用六味地黄丸，须先清痰湿热邪或就医' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_adult_yin_bone_soup', pages: [52, 77, 137, 159, 162, 200], reason: '舌苔厚腻发黄属湿热或痰湿营养过剩（干焦黑苔属外感高热实邪），原书严戒进补并应以清热祛湿为主，忌煲猪龙骨滋阴肉汤' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_jinkui_shenqi', pages: [56, 150, 151, 159], reason: '舌苔厚腻发黄或高热干焦发黑均属湿热、痰热或外感实热，非舌淡苔白之肾阳虚，切忌误当肾虚服用含附子肉桂之金匮肾气丸，否则越补越热' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_fuzi_lizhong', pages: [56, 150, 153, 159], reason: '舌苔厚腻发黄或高热干焦发黑均属湿热、痰热或外感实热，非舌淡苔白之脾胃虚寒，忌服温热助火之附子理中丸' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_buzhong_bazhen', pages: [56, 77, 158, 159, 200], reason: '舌苔厚腻发黄（伴舌红或红点）或高热干焦发黑属湿热痰热或外感热极重证，原书严戒进补且须先祛湿清热，忌直服补中益气丸与八珍糕' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_danggui_chicken_soup', pages: [56, 77, 158, 159, 162, 200], reason: '舌苔厚腻发黄（伴舌红或红点）或高热干焦发黑属湿热痰热营养过剩或热极实邪，原书严戒进补并倡素食“以清为补”，忌喝当归养血鸡汤' },
    { when: ['opt_coat_yellow_greasy'], target: 'rem_yulinggao', pages: [56, 77, 158, 159, 162, 200], reason: '舌苔厚腻发黄（伴舌红或红点）或高热干焦发黑属湿热痰热营养过剩或热极实邪，原书严戒进补，忌服含温性龙眼肉与西洋参之玉灵膏' },
    { when: ['opt_shape_red_cracks'], target: 'rem_jinkui_shenqi', pages: [139, 144, 150, 151], reason: '舌质红而布满深裂纹属典型阴虚津亏失濡（非舌淡苔白之肾阳虚），忌服含附子肉桂温阳之金匮肾气丸' },
    { when: ['opt_shape_red_cracks'], target: 'rem_fuzi_lizhong', pages: [139, 150, 153], reason: '舌质红而布满深裂纹属典型阴虚津亏内热（非舌淡苔白之脾胃虚寒），忌服温热助火之附子理中丸' },
  ];

  const CAUSAL = [
    {
      id: 'liver',
      num: '①',
      short: '① 情绪肝郁传变',
      summary: '情绪肝郁 → 木克脾土 → 体质连锁',
      title: '① 情绪肝郁 → 木克脾土 → 体质连锁',
      nodes: [
        {
          id: 'emotion', kind: 'root', label: '情绪失常 · 肝气不舒', sub: '攀比焦虑 · 隐忍郁怒', pages: [165, 168, 132],
          mech: '现代人攀比与压力空前，七情求而不得，长期担忧、着急、焦虑；书中指出约80%的疾病、90%的女性疾病与情绪相关。自我要求苛刻、委屈隐忍的“老好人”把火憋在心里成“郁怒”，比发泄出来的暴怒伤害更深（P.165-169）。复合体质以脾胃失调为中轴，撬动全局的总根源却在情绪（P.132-133）。',
          block: '调神安神是最高原则：《黄帝内经》讲春天要在庭院里散散步、调整情绪，“要把好东西尽量给予大家，不要去夺取，尽量奖赏别人，不要去惩罚他”（P.166）；复合体质必须一边疏肝调神，一边同步祛湿、化瘀、滋阴或温阳（P.166-167）。',
          constitutions: ['qi_stagnation'], remedies: [], signs: ['sign_stagnation_pointed_red'],
        },
        {
          id: 'earth', label: '木克脾土', sub: '脾胃受伤', pages: [132, 173, 180],
          mech: '肝属木、脾属土，肝气不舒会横逆克伐脾土：脾胃一伤，则水湿重、化血少、气虚致瘀、湿聚成痰，层层交缠（P.131-133）；消化道表现为胃痛、胃溃疡、反流性食管炎与夜间胃酸上逆所致的慢性咽炎（P.173-174）。',
          block: '张仲景“见肝之病，知肝传脾，当先实脾”：肝郁胃痛服舒肝和胃丸；脾胃虚寒的胃溃疡配黄芪建中汤（罗氏用生黄芪6克防上火）柔肝建中（P.180-181）。',
          constitutions: ['qi_stagnation', 'qi_deficiency'], remedies: ['rem_shugan_huangqi_jianzhong'], signs: ['sign_qi_saliva_lines'],
        },
        {
          id: 'fire', label: '肝火伤阴', sub: '耗伤肝阴津血', pages: [131, 141],
          mech: '贪、嗔、痴与焦虑郁闷导致肝气不舒，郁而化为肝火，耗伤肝阴与津血，形成阴虚内热（P.131-133）。',
          block: '先稳情绪、疏肝气，防止药食化火（P.132-133）；阴虚者甘凉濡润，用生地、沙参、麦冬、石斛等滋补津液，成人可煲滋阴猪龙骨汤，确属肾阴虚用六味地黄丸（P.140-144）。',
          constitutions: ['yin_deficiency'], remedies: ['rem_adult_yin_bone_soup', 'rem_liuwei_dihuang'], signs: ['sign_yin_red_thin_coat'],
        },
        {
          id: 'metal', label: '木火刑金', sub: '凌晨3-5点早醒', pages: [174, 184],
          mech: '肝火过旺反侮肺金（“木火刑金”），可引起咳嗽、走路气喘、出虚汗乃至严重肺病；典型信号是凌晨3～5点肺经当令时无故早醒（P.174-175）。',
          block: '对照肺经循行路线，用小木棒沿胳膊内侧敲打找痛点，每天揉敲到不痛为止，早醒即可随之消失（P.183-185）；若已伴持续咳嗽、气喘、出虚汗，须及时就医排查（P.174-175）。',
          constitutions: ['qi_stagnation'], remedies: ['rem_tap_lung_meridian'], signs: ['sign_stagnation_heart_fire_tip'],
        },
        {
          id: 'qixue', kind: 'leaf', label: '气血两虚', sub: '化血少 · 推动弱', pages: [64, 132],
          mech: '脾气不足、无力化生营养则致血虚（P.64）；肝木克土使脾胃受伤、化血减少，气血随之两亏（P.131-133）。',
          block: '有湿先祛湿，湿退马上补脾（山药薏苡仁芡实粥、八珍糕，P.83-87）；血虚日常用当归养血鸡汤，严重者用玉灵膏养心血、安心神（P.97-102）。',
          constitutions: ['qi_deficiency', 'blood_deficiency'], remedies: ['rem_shanyao_yiyiren_qianshi', 'rem_danggui_chicken_soup', 'rem_yulinggao'], signs: [],
        },
        {
          id: 'phlegm', kind: 'leaf', label: '痰湿 · 三高', sub: '湿聚成痰', pages: [156, 157],
          mech: '压力郁闷致肝气不舒、木克脾土，加之美食面前管不住嘴，脾虚水湿久留蒸发凝炼成黏稠“痰湿”（P.155-156）；舌面黏腻水液或白霜样厚腻苔者，体检基本已有“三高”（P.157-158）。',
          block: '严禁进补；用罗氏去生姜温胆汤泡脚化痰清热（热重竹茹配至9克，P.160-161），坚持萝卜白菜、粗茶淡饭“以清为补”并规律运动（P.159-162）。',
          constitutions: ['phlegm_dampness'], remedies: ['rem_wendan_footbath', 'rem_phlegm_diet_exercise'], signs: ['sign_phlegm_sticky_fluid', 'sign_phlegm_frost_thick'],
        },
        {
          id: 'stasis', kind: 'leaf', label: '血瘀', sub: '气虚 · 气郁致瘀', pages: [108, 105],
          mech: '“气为血之帅，血为气之母”：脾、肾、肺气不足则推动血行无力，血流在弯曲受阻处滞留成瘀（P.108）；生气时肝气不舒，也会直接在体内留下顽固郁结与隐匿痛点（P.105-106）。',
          block: '气郁致瘀必先疏肝理气，一边疏肝一边化瘀（P.107, 128）；脾虚痰湿阻碍吸收者，药汁泡脚透皮通络常比喝药效果好（P.121-122）。孕妇舌现瘀象属正常，严禁活血化瘀（P.119）。',
          constitutions: ['blood_stasis'], remedies: ['rem_region_stasis_decoctions', 'rem_yaotui_hanshi_footbath'], signs: ['sign_stasis_tip_spots'],
        },
      ],
      edges: [
        { from: 'emotion', to: 'earth', label: '木克土' },
        { from: 'emotion', to: 'fire', label: '郁而化火' },
        { from: 'emotion', to: 'metal', label: '火旺侮金' },
        { from: 'earth', to: 'qixue', label: '化血少' },
        { from: 'earth', to: 'phlegm', label: '湿聚成痰' },
        { from: 'earth', to: 'stasis', label: '气虚致瘀' },
      ],
    },
    {
      id: 'damp',
      num: '②',
      short: '② 祛湿补脾',
      summary: '湿气蒙蔽 → 先祛湿 → 随手补脾防复发',
      title: '② 湿气蒙蔽 → 先祛湿 → 随手补脾防复发',
      nodes: [
        {
          id: 'cover', kind: 'root', label: '湿气蒙蔽舌面', sub: '白苔满布 · 厚腻苔', pages: [64, 71],
          mech: '脾属土、土克水，“脾主统水”；脾气、肾气虚则水液代谢废物无法经尿液、汗液排出，停滞成湿邪（P.64）。白苔一直铺满到舌边、不露舌肉底色，提示水湿偏重（P.66, 71）。',
          block: '先排除喝牛奶、短时积食造成的浮泛无根苔（清淡饮食一天即退，P.79-80），并切忌刮舌苔（P.53-55）；确属湿重，按“湿重遮蔽、必先祛湿”处理。',
          constitutions: ['qi_deficiency'], remedies: [], signs: ['sign_qi_full_coating', 'sign_qi_spleen_damp_full'],
        },
        {
          id: 'mask', label: '遮蔽真实舌质', sub: '热象 · 阴虚 · 瘀血 · 肝郁尖舌', pages: [74, 118, 138, 178],
          mech: '满布白苔或厚腻苔常把体内的热象、阴虚、血瘀或肝郁尖舌遮住：湿掩热（P.74）、湿罩瘀（P.118-119）、湿掩阴虚（P.138）、尖舌覆白苔（P.178）。',
          block: '此时盲目进补或直服六味地黄丸等滋腻药必加重失调（P.142, 159）；须先祛湿化痰，待腻苔退后露出真实舌质再议下一步。',
          constitutions: [], remedies: [], signs: ['sign_qi_damp_masks_heat', 'sign_stasis_damp_masked', 'sign_yin_masked_by_damp', 'sign_stagnation_pointed_white_coat'],
        },
        {
          id: 'dispel', label: '第一步 · 先祛湿', sub: '脾胃弱不吸药者泡脚优于喝药', pages: [83, 121, 161],
          mech: '湿重蒙蔽时以祛湿为第一步，兼热者稍佐清热（P.65, 74-75, 83）；现代人多脾虚痰湿、口服吸收差，药汁泡脚透皮走经络效果常优于喝药（P.121, 161）。',
          block: '一般湿重首选三仁汤泡脚；春夏湿热用薏苡仁赤小豆饮；秋冬用白蔻仁、砂仁、花椒做菜并以川椒水泡脚（P.83-85）；痰湿化热用去生姜温胆汤泡脚（P.160）。',
          constitutions: ['qi_deficiency', 'phlegm_dampness'], remedies: ['rem_sanren_footbath', 'rem_yiyiren_chixiaodou', 'rem_autumn_winter_spice_footbath', 'rem_wendan_footbath'], signs: [],
        },
        {
          id: 'tonify', label: '第二步 · 随手补脾', sub: '湿气一退马上补', pages: [65, 85, 87],
          mech: '若只祛水湿而不紧接着补脾，康复只是暂时的（P.64-65）；补脾能使水谷精微吸收增多，双向带动肾气与肺气（P.65）。',
          block: '湿气一退马上用怀山药、薏苡仁、芡实（小米）粥，或补中益气丸、八珍糕常养脾气（P.85-87）。',
          constitutions: ['qi_deficiency'], remedies: ['rem_shanyao_yiyiren_qianshi', 'rem_buzhong_bazhen'], signs: [],
        },
        {
          id: 'stable', kind: 'leaf', label: '脾土统水 · 防复发', sub: '土生金，带动肺肾之气', pages: [65, 85],
          mech: '脾气足则能统摄水液，“土生金”又能充养肺卫，减少反复感冒（P.64-65）。',
          block: '湿清气畅后配合适度日晒与运动（P.83-85），严戒早起喝凉白开、饮茶过量与冰镇饮料（P.85-86）。',
          constitutions: ['qi_deficiency'], remedies: [], signs: [],
        },
        {
          id: 'relapse', kind: 'warn', label: '不补脾', sub: '三五天湿复回', pages: [65],
          mech: '只祛湿不补脾，三五天后水湿又会卷土重来，久之凝结成顽固痰湿（P.65）。',
          block: '回到第二步：湿一退立即补脾固土，切断“祛湿—复发”循环（P.65, 83）。',
          constitutions: ['phlegm_dampness'], remedies: ['rem_shanyao_yiyiren_qianshi'], signs: [],
        },
      ],
      edges: [
        { from: 'cover', to: 'mask', label: '遮蔽' },
        { from: 'mask', to: 'dispel', label: '先排湿' },
        { from: 'dispel', to: 'tonify', label: '湿一退' },
        { from: 'tonify', to: 'stable', label: '固土' },
        { from: 'dispel', to: 'relapse', dashed: true, label: '若不补脾' },
        { from: 'relapse', to: 'cover', dashed: true, label: '复发循环' },
      ],
    },
    {
      id: 'yin',
      num: '③',
      short: '③ 阴血阳转化',
      summary: '阴虚 ⇄ 血虚 → 阳虚 动态转化',
      title: '③ 阴虚 → 血虚 → 阳虚 动态转化',
      nodes: [
        {
          id: 'yinx', kind: 'root', label: '阴虚', sub: '舌红苔薄 · 五心烦热', pages: [131, 137],
          mech: '阴是体内主濡润、主安静的血液与津液，“阴虚则生内热”，像发动机缺了润滑油干转生热（P.131）；熬夜、嗜食辛辣、小儿过食肉类及焦虑郁闷是主因（P.132-133）。典型见无外感而舌红苔薄或无苔，伴五心烦热、盗汗、大便干、脉快（P.133-138）。',
          block: '小儿用七味滋阴方并坚持少吃肉、多吃青菜半年以上；成人煲生地沙参石斛猪龙骨汤；肾阴虚用六味地黄丸——湿热者禁服，阳虚者先补阳，脾弱者用砂仁泡水冲服（P.136, 140-144）。',
          constitutions: ['yin_deficiency'], remedies: ['rem_child_nourish_yin', 'rem_adult_yin_bone_soup', 'rem_liuwei_dihuang'], signs: ['sign_yin_red_thin_coat', 'sign_yin_geographic_tongue'],
        },
        {
          id: 'bloodx', label: '血虚', sub: '舌淡白 · 淡嫩', pages: [140, 97],
          mech: '舌头红以血液充盈为前提：阴虚严重会进一步耗少血液，舌质由红慢慢变成淡白，即由阴虚转为血虚，作者所见绝大多数是这一方向；也有少数血虚者淡白舌渐渐转红，是血虚向阴虚转化（P.140）。',
          block: '已转为血虚者重点养血，血养足后舌头会慢慢变红、舌苔重新长出（P.140）；日常用当归养血鸡汤，严重者用玉灵膏（P.97-102）。',
          constitutions: ['blood_deficiency'], remedies: ['rem_danggui_chicken_soup', 'rem_yulinggao'], signs: ['sign_yin_red_to_pale_shift', 'sign_blood_typical_transparent'],
        },
        {
          id: 'yangx', kind: 'leaf', label: '阳虚', sub: '舌淡苔白 · 偏苍老', pages: [148, 144, 150],
          mech: '血虚时间长了，哪怕夏天手脚都不热，就已变成阳虚体质（P.148）；所有的肾阳虚都是在肾阴虚的基础上形成的（P.144）。阳虚舌与血虚舌很像：阳虚舌质淡、苔白、看上去“苍老”，血虚舌淡白而“淡嫩”（P.150）。',
          block: '阳虚时不要马上补阴，应先补阳再补阴或两者同时进行，金匮肾气丸即此作用（P.144）；脾阳不足、一沾凉就胃痛腹泻者用附子理中丸或理中丸（P.152-153）。',
          constitutions: ['yang_deficiency'], remedies: ['rem_jinkui_shenqi', 'rem_fuzi_lizhong'], signs: ['sign_yang_pale_aged'],
        },
      ],
      edges: [
        { from: 'yinx', to: 'bloodx', label: '耗血 · 多见' },
        { from: 'bloodx', to: 'yinx', dashed: true, label: '少数转红' },
        { from: 'yinx', to: 'yangx', label: '肾阴虚→肾阳虚' },
        { from: 'bloodx', to: 'yangx', label: '血虚日久' },
      ],
    },
  ];

  /* =========================================================
     2. EXTENDED INLINE CITATION PARSER (§4.2 + Full KB verified)
     ========================================================= */
  const CITE_NUM = String.raw`\d+(?:\s*[-–—~～]\s*\d+)?`;
  const CITE_LOC = '后记|附录|前言|序言|自序';
  const CITE_PFX = String.raw`(?:(?:参|详|另|并)?见|参照|依)?\s*(?:原书)?\s*`;
  const CITE_NUMS = String.raw`${CITE_NUM}(?:\s*[、,，/]\s*(?:(?:${CITE_LOC})\s*)?(?:pp?\.?\s*)?${CITE_NUM}(?=\s*(?:[、,，/;；：:]|页|插图|图|$|\s)))*`;
  const CITE_PAGE_P = String.raw`(?:(${CITE_LOC})\s*)?pp?\.?\s*(${CITE_NUMS})(?:\s*(插图|图))?`;
  const CITE_PAGE_CN = String.raw`(?:(${CITE_LOC})\s*)?第\s*(${CITE_NUMS})\s*页(?:\s*[、,，/]\s*(?:(?:${CITE_LOC})\s*)?第\s*(${CITE_NUMS})\s*页)*(?:\s*(插图|图))?`;
  const CITE_PAGES = String.raw`${CITE_PFX}(?:${CITE_PAGE_P}|${CITE_PAGE_CN})`;
  const CITE_HEAD = new RegExp(String.raw`^${CITE_PAGES}(?:(?:\s*[，,；;：:]\s*|\s+|(?=[“"「『‘']))(.+))?$`, 'i');
  const CITE_TAIL = new RegExp(String.raw`^(.+?)(?:\s*[，,；;：:]\s*|\s+)${CITE_PAGES}$`, 'i');
  const CITE_INLINE = new RegExp(String.raw`(?:(?:参|详|另|并)?见|参照)?\s*(?:(${CITE_LOC})\s*)?pp?\.\s*(${CITE_NUMS})(?:\s*(插图|图))?`, 'gi');
  const CITE_FIG = /\s*fig_p0*(\d+)[a-z]?/gi;
  const CITE_DOSE = /\d+(?:\.\d+)?\s*(?:克|g|毫升|ml|两|钱)/i;
  const PAREN_RE = /\s*([（(])([^（）()]*)([)）])/g;
  const CITE_BOUNDARY = new Set([...'。，；：、！？!?;,:\n']);
  const CITE_OPEN = { '）': '（', ')': '(', '”': '“', '’': '‘', '」': '「', '』': '『' };
  const GLOSS_MAX = 30;

  const normPages = str => [...new Set([...str.matchAll(new RegExp(CITE_NUM, 'g'))].map(x => x[0].replace(/\s*[-–—~～]\s*/, '–')))].join(', ');

  function extractPagesMatch(m, offset) {
    const loc = m[offset] || m[offset + 3] || '';
    const rawNums = [m[offset + 1], m[offset + 4], m[offset + 5]].filter(Boolean).join(', ');
    const isFig = Boolean(m[offset + 2] || m[offset + 6]);
    return { loc, rawNums, isFig };
  }

  function stripInlineFromRest(text) {
    const nums = [];
    let loc = '';
    let isFig = false;
    const cleaned = text.replace(CITE_INLINE, (_, l, n, f) => {
      if (l && !loc) loc = l;
      if (f) isFig = true;
      nums.push(n);
      return ' ';
    });
    if (!nums.length) return { text, nums: [], loc: '', isFig: false };
    const tidy = cleaned
      .replace(/\s+/g, ' ')
      .replace(/([依按据])\s+/g, '$1')
      .replace(/原书\s+明/g, '原书明')
      .replace(/\s*([，,；;：:、])\s*/g, '$1')
      .replace(/([，,；;：:、]){2,}/g, '$1')
      .replace(/^[，,；;：:、\s]+|[，,；;：:、\s]+$/g, '');
    return { text: tidy, nums, loc, isFig };
  }

  function parseParen(inner) {
    const figs = [];
    const str = inner
      .replace(CITE_FIG, (_, n) => {
        figs.push(n);
        return '';
      })
      .replace(/^[，,；;：:、\s]+|[，,；;：:、\s]+$/g, '');
    let loc = '';
    let rawNums = '';
    let isFig = false;
    let rest = '';
    let m;
    if ((m = CITE_HEAD.exec(str))) {
      ({ loc, rawNums, isFig } = extractPagesMatch(m, 1));
      rest = m[8] || '';
      const extra = stripInlineFromRest(rest);
      if (extra.nums.length) {
        rawNums = [rawNums, ...extra.nums].filter(Boolean).join(', ');
        rest = extra.text;
        if (!loc && extra.loc) loc = extra.loc;
        if (extra.isFig) isFig = true;
      }
    } else if ((m = CITE_TAIL.exec(str))) {
      rest = m[1] || '';
      ({ loc, rawNums, isFig } = extractPagesMatch(m, 2));
      const extra = stripInlineFromRest(rest);
      if (extra.nums.length) {
        rawNums = [...extra.nums, rawNums].filter(Boolean).join(', ');
        rest = extra.text;
        if (!loc && extra.loc) loc = extra.loc;
        if (extra.isFig) isFig = true;
      }
    } else if (figs.length && /^(?:(?:参|详|另|并)?见)?$/.test(str)) {
      return { pages: figs.join(', '), loc: '插图', quote: '', quoted: false, keep: '' };
    } else {
      const extra = stripInlineFromRest(str);
      if (!extra.nums.length) return null;
      loc = extra.loc;
      rawNums = extra.nums.join(', ');
      isFig = extra.isFig;
      rest = extra.text;
    }
    if (figs.length && !rawNums) rawNums = figs.join(', ');
    const c = {
      pages: normPages(rawNums),
      loc: loc || (isFig || figs.length ? '插图' : ''),
      quote: '',
      quoted: false,
      keep: '',
    };
    rest = rest.trim().replace(/^[，,；;：:、\s]+|[，,；;：:、\s]+$/g, '');
    if (!rest) return c;
    const q = /^[“"「『‘'](.*)[”"」』’']$/.exec(rest);
    const body = q ? q[1] : rest;
    if ([...body].length <= GLOSS_MAX && !CITE_DOSE.test(body)) {
      c.quote = body;
      c.quoted = Boolean(q);
    } else {
      c.keep = rest;
    }
    return c;
  }

  const citeHeadLine = c => '原文 · ' + (c.loc && c.loc !== '插图' ? c.loc + ' ' : '') + 'p.' + c.pages + (c.loc === '插图' ? ' 插图' : '');

  function anchorStart(text, from, floor) {
    let j = from;
    while (j > floor) {
      const ch = text[j - 1];
      if (Object.hasOwn(CITE_OPEN, ch)) {
        const k = text.lastIndexOf(CITE_OPEN[ch], j - 2);
        if (k < floor) break;
        j = k;
        continue;
      }
      if (CITE_BOUNDARY.has(ch)) break;
      j--;
    }
    return j;
  }

  function splitCites(text) {
    const out = [];
    let last = 0;
    let pending = null;
    const pushText = seg => {
      if (seg) out.push({ type: 'text', s: seg });
    };
    for (const m of text.matchAll(PAREN_RE)) {
      const c = parseParen(m[2]);
      if (!c) continue;
      const { keep, ...cite } = c;
      const kept = keep ? m[1] + keep + m[3] : '';
      const prev = out[out.length - 1];
      if (m.index === last && prev && prev.type === 'cite' && !kept) {
        prev.pages = normPages(prev.pages + ', ' + cite.pages);
        if (cite.quote && !prev.quote) {
          prev.quote = cite.quote;
          prev.quoted = cite.quoted;
        }
        last = m.index + m[0].length;
        continue;
      }
      const j = anchorStart(text, m.index, last);
      if (pending) flushPending(j);
      if (j === m.index) {
        pushText(text.slice(last, m.index));
        pushText(kept);
        pending = cite;
      } else {
        pushText(text.slice(last, j));
        out.push({ type: 'cite', anchor: text.slice(j, m.index), ...cite });
        pushText(kept);
      }
      last = m.index + m[0].length;
    }
    if (pending) flushPending(text.length);
    pushText(text.slice(last));
    return out;

    function flushPending(limit) {
      let k = last;
      while (k < limit && !CITE_BOUNDARY.has(text[k])) k++;
      if (k > last) out.push({ type: 'cite', anchor: text.slice(last, k), ...pending });
      last = k;
      pending = null;
    }
  }

  function stripCites(text) {
    if (!text) return '';
    return text.replace(PAREN_RE, (all, o, inner, cl) => {
      const c = parseParen(inner);
      if (!c) return all;
      const body = c.keep || (c.quote ? (c.quoted ? '“' + c.quote + '”' : c.quote) : '');
      return body ? o + body + cl : '';
    });
  }

  /* =========================================================
     3. DATA INDEXES & STATE
     ========================================================= */
  const byId = (list, key = 'id') => new Map(list.map(item => [item[key], item]));
  const unique = list => [...new Set(list)];
  const herbKey = name => name.replace(/[（(][^）)]*[）)]/g, '').trim();

  function groupMany(list, keysOf) {
    const map = new Map();
    for (const item of list) {
      for (const key of keysOf(item)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
      }
    }
    return map;
  }

  const FIG = byId(KB.figures, 'fig_id');
  const CHAPTER = byId(KB.chapters);
  const CONST = byId(KB.constitutions);
  const CONST_ORDER = new Map(KB.constitutions.map((c, idx) => [c.id, idx]));
  const SIGN = byId(KB.tongue_signs);
  const REMEDY = byId(KB.remedies);
  const ZONE = byId(KB.tongue_zones);
  const PAIR = byId(KB.compare_pairs);
  const PRECHECK = byId(KB.pre_checks);
  const STEPS = KB.decision_tree.steps;
  const STEP = byId(STEPS);

  const BASELINE_OPTION = {
    id: 'opt_sym_baseline',
    label: '无明显不适（基本健康基线）',
    hint: '淡红舌、薄白苔、体态血络正常且日常精力睡眠排便良好，保持规律作息、均衡饮食与平和情绪即可（p.35, 191-192）。',
    fig_id: 'fig_p035',
    match_constitution_ids: [],
    match_sign_ids: ['sign_normal_pale_red'],
    next_step_id: null,
  };

  const OPTION = new Map(STEPS.flatMap(step => step.options.map((option, index) => [option.id, { step, option, index }])));
  OPTION.set(BASELINE_OPTION.id, { step: STEPS.at(-1), option: BASELINE_OPTION, index: -1 });
  const CONST_BY_CHAPTER = byId(KB.constitutions, 'chapter_id');
  const SIGNS_BY_ZONE = groupMany(KB.tongue_signs, sign => sign.zone_ids);
  const SIGNS_BY_CONST = groupMany(KB.tongue_signs, sign => sign.constitution_ids);
  const HERBS = groupMany(KB.remedies, remedy => unique(remedy.ingredients.map(ing => herbKey(ing.name))));

  const sortSigns = list => list.toSorted((a, b) => (RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]) || (a.page - b.page));

  const ATLAS_DEFAULT = { risk: 'all', constitution: 'all', zone: 'all', tag: 'all' };
  const REMEDY_DEFAULT = { type: 'all', constitution: 'all', keyword: '' };

  const state = {
    tab: 'overview',
    tabScroll: { overview: 0, zones: 0, wizard: 0, atlas: 0, remedies: 0, mastery: 0 },
    ovSeg: 'chapters',
    inspect: { kind: 'chapter', id: KB.chapters[0].id },
    constSignsExpanded: false,
    zone: KB.tongue_zones[0].id,
    zoneMode: 'map',
    zoneSubFilter: { risk: 'all', constitution: 'all' },
    zoneExpanded: false,
    prechecks: new Set(),
    gateOpenDesc: new Set(),
    gateReadoutExpanded: false,
    gateConfirmed: false,
    choices: new Map(),
    step: STEPS[0].id,
    mutexNotice: null,
    priorityNoticeExpanded: false,
    roSignsExpanded: false,
    expandedContraIds: new Set(),
    atlas: { ...ATLAS_DEFAULT },
    atlasSeg: 'signs',
    pair: KB.compare_pairs[0].id,
    remedy: { ...REMEDY_DEFAULT },
    selectedRemedyId: KB.remedies[0].id,
    masteryView: 'causal',
    graph: CAUSAL[0].id,
    selectedNodeByGraph: new Map(CAUSAL.map(g => [g.id, g.nodes[0].id])),
    quizIndex: 0,
    answers: new Map(),
    searchCat: 'all',
    hits: [],
    hitIndex: 0,
    sheetCtx: null,
    signModalCtx: null,
    lightboxCtx: null,
    origin: null,
    failedFigs: new Set(),
  };

  /* =========================================================
     4. DOM & SVG HELPERS + ICONS
     ========================================================= */
  const $ = id => document.getElementById(id);
  const tabletUpMQ = matchMedia('(min-width: 640px)');
  const desktopMQ = matchMedia('(min-width: 1080px)');
  const wideDeskMQ = matchMedia('(min-width: 1360px)');
  const hoverMQ = matchMedia('(hover: hover)');
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollMode = () => (reduceMQ.matches ? 'auto' : 'smooth');
  const isActivationKey = e => (e.key === 'Enter' || e.key === ' ') && !e.isComposing && e.keyCode !== 229;

  function applyAttrs(el, attrs) {
    if (!attrs) return;
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value === true ? '' : String(value));
      }
    }
  }

  const kidsOf = kids => kids.flat(Infinity)
    .filter(kid => kid !== undefined && kid !== null && kid !== false && kid !== '')
    .map(kid => (kid instanceof Node ? kid : String(kid)));

  function fill(el, ...kids) {
    if (!el) return;
    el.replaceChildren(...kidsOf(kids));
  }

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (tag === 'button') el.type = 'button';
    applyAttrs(el, attrs);
    el.append(...kidsOf(kids));
    return el;
  }

  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(SVG_NS, tag);
    applyAttrs(el, attrs);
    el.append(...kidsOf(kids));
    return el;
  }

  function iconSvg(kind, sizeCls = '') {
    const cls = `icon ${sizeCls}`.trim();
    const attrs = { class: cls, viewBox: '0 0 20 20', 'aria-hidden': 'true' };
    switch (kind) {
      case 'check':
        return s('svg', attrs, s('path', { d: 'M4.5 10.5l3.6 3.6L15.5 6.5' }));
      case 'check-circle':
        return s('svg', attrs, s('circle', { cx: 10, cy: 10, r: 7.5 }), s('path', { d: 'M6.8 10.2l2.2 2.2 4.4-4.5' }));
      case 'warn-circle':
        return s('svg', attrs, s('circle', { cx: 10, cy: 10, r: 7.5 }), s('path', { d: 'M10 6.5v4.2M10 13.5h.01' }));
      case 'triangle':
        return s('svg', attrs, s('path', { d: 'M10 3.2L17.6 16.5H2.4L10 3.2z' }), s('path', { d: 'M10 8.2v3.8M10 14.3h.01' }));
      case 'shield':
        return s('svg', attrs, s('path', { d: 'M10 2.6l6.2 2.4v4.6c0 4.1-2.6 6.8-6.2 8.2-3.6-1.4-6.2-4.1-6.2-8.2V5L10 2.6z' }), s('path', { d: 'M10 6.8v3.8M10 13.2h.01' }));
      case 'ban':
        return s('svg', attrs, s('circle', { cx: 10, cy: 10, r: 7.2 }), s('path', { d: 'M5 15L15 5' }));
      case 'cross':
        return s('svg', attrs, s('path', { d: 'M5.5 5.5l9 9M14.5 5.5l-9 9' }));
      case 'cross-circle':
        return s('svg', attrs, s('circle', { cx: 10, cy: 10, r: 7.5 }), s('path', { d: 'M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6' }));
      case 'lock':
        return s('svg', attrs, s('rect', { x: 4.5, y: 9, width: 11, height: 8, rx: 2 }), s('path', { d: 'M7 9V6.5a3 3 0 0 1 6 0V9' }));
      case 'arrow-up':
        return s('svg', attrs, s('path', { d: 'M10 15.5V4.5M5.5 9L10 4.5 14.5 9' }));
      case 'arrow-left':
        return s('svg', attrs, s('path', { d: 'M15.5 10H4.5M9 5.5L4.5 10 9 14.5' }));
      case 'doc':
        return s('svg', attrs, s('path', { d: 'M5.5 3h6l3 3v11h-9V3z' }), s('path', { d: 'M11.5 3v3h3M7.5 9.5h5M7.5 12.5h5' }));
      case 'chevron-right':
        return s('svg', attrs, s('path', { d: 'M7.5 5l5 5-5 5' }));
      case 'chevron-down':
        return s('svg', attrs, s('path', { d: 'M5.5 7.5L10 12l4.5-4.5' }));
      case 'chevron-up':
        return s('svg', attrs, s('path', { d: 'M5.5 12.5L10 8l4.5 4.5' }));
      case 'sliders':
        return s('svg', attrs, s('path', { d: 'M3.5 6h13M3.5 14h13M7.5 4v4M12.5 12v4' }));
      case 'search':
        return s('svg', attrs, s('circle', { cx: 9, cy: 9, r: 5.5 }), s('path', { d: 'M13.2 13.2L17 17' }));
      case 'herb':
        return s('svg', attrs, s('path', { d: 'M15.5 4.5C9.5 4.5 5 8.5 5 14.5c6 0 10-4.5 10.5-10zM5 15l5.5-5.5' }));
      default:
        return s('svg', attrs);
    }
  }

  function mark(text, terms) {
    if (!text) return '';
    const list = (Array.isArray(terms) ? terms : String(terms).split(/\s+/))
      .filter(Boolean)
      .map(t => t.toLowerCase());
    if (!list.length) return text;
    const lower = text.toLowerCase();
    const out = [];
    let pos = 0;
    while (pos < text.length) {
      let at = -1;
      let len = 0;
      for (const term of list) {
        const found = lower.indexOf(term, pos);
        if (found !== -1 && (at === -1 || found < at || (found === at && term.length > len))) {
          at = found;
          len = term.length;
        }
      }
      if (at === -1) {
        out.push(text.slice(pos));
        break;
      }
      if (at > pos) out.push(text.slice(pos, at));
      out.push(h('mark', null, text.slice(at, at + len)));
      pos = at + len;
    }
    return out;
  }

  /* A-level rich text with inline .cite-ref spans */
  function richText(text, kw = '') {
    if (!text) return '';
    const segs = splitCites(text);
    return segs.map(seg => {
      if (seg.type === 'text') return mark(seg.s, kw);
      const span = h('span', {
        class: 'cite-ref',
        role: 'button',
        tabindex: '0',
        'aria-expanded': 'false',
        'aria-controls': 'cite-popover',
        'data-pages': seg.pages,
        'data-loc': seg.loc || null,
        'data-quote': seg.quote || null,
        'data-quoted': seg.quoted ? 'true' : null,
      }, mark(seg.anchor, kw));
      return span;
    });
  }

  const plainText = text => stripCites(text);

  function firstSentence(text) {
    const clean = stripCites(text).trim();
    if (!clean) return '';
    const idx = clean.search(/[。；！？\n]/);
    return idx === -1 ? clean : clean.slice(0, idx);
  }

  const shortName = c => c.name.replace(/体质$/, '');
  const stepShort = st => STEP_SHORT[st.id] ?? st.title.replace(/^.*?：/, '').slice(0, 4);
  const stripStepPrefix = title => title.replace(/^第[一二三四五六七八九十\d]+步[：:]\s*/, '');
  const chapterOfPage = page => KB.chapters.find(c => page >= c.page_start && page <= c.page_end);

  /* =========================================================
     5. SINGLETON #cite-popover CONTROLLER (§4.4 - §4.6)
     ========================================================= */
  const citePop = $('cite-popover');
  const citeMount = $('cite-popover-mount');
  let activeCiteEl = null;
  let citePinned = false;
  let citeHoverTimer = 0;
  let citeLeaveTimer = 0;

  function clearCiteTimers() {
    if (citeHoverTimer) {
      clearTimeout(citeHoverTimer);
      citeHoverTimer = 0;
    }
    if (citeLeaveTimer) {
      clearTimeout(citeLeaveTimer);
      citeLeaveTimer = 0;
    }
  }

  function isViewingChapterInOverview(chId) {
    if (state.tab !== 'overview') return false;
    if (state.inspect.kind !== 'chapter' || state.inspect.id !== chId) return false;
    if (desktopMQ.matches) return true;
    return Boolean($('sheet-dialog').open && state.sheetCtx?.type === 'overview');
  }

  function closeCitePopover(restoreFocus = false) {
    clearCiteTimers();
    const prev = activeCiteEl;
    activeCiteEl = null;
    citePinned = false;
    if (prev) {
      prev.setAttribute('aria-expanded', 'false');
      prev.removeAttribute('aria-describedby');
    }
    if (citePop.matches(':popover-open')) {
      citePop.hidePopover();
    }
    if (restoreFocus && prev && prev.isConnected) {
      prev.focus({ preventScroll: true });
    }
  }

  function positionCitePopover(anchorEl, pointerEvent = null) {
    const rects = [...anchorEl.getClientRects()];
    if (!rects.length) return;
    let refRect = rects[0];
    if (pointerEvent && typeof pointerEvent.clientX === 'number') {
      const hit = rects.find(r => pointerEvent.clientX >= r.left - 4 && pointerEvent.clientX <= r.right + 4 && pointerEvent.clientY >= r.top - 4 && pointerEvent.clientY <= r.bottom + 4);
      if (hit) refRect = hit;
    }
    citePop.style.left = '0px';
    citePop.style.top = '0px';
    const popRect = citePop.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const anchorCenterX = refRect.left + refRect.width / 2;
    let left = Math.round(anchorCenterX - popRect.width / 2);
    left = Math.max(16, Math.min(vw - popRect.width - 16, left));

    let top = Math.round(refRect.bottom + 8);
    let side = 'bottom';
    if (top + popRect.height > vh - 12 && refRect.top > vh - refRect.bottom) {
      top = Math.max(12, Math.round(refRect.top - popRect.height - 8));
      side = 'top';
    }
    citePop.dataset.side = side;
    citePop.style.left = `${left}px`;
    citePop.style.top = `${top}px`;
    const arrowX = Math.max(12, Math.min(popRect.width - 12, Math.round(anchorCenterX - left)));
    citePop.style.setProperty('--arrow-x', `${arrowX}px`);
  }

  function openCitePopover(anchorEl, { pinned = false, pointerEvent = null, focusInside = false } = {}) {
    clearCiteTimers();
    if (activeCiteEl && activeCiteEl !== anchorEl) {
      activeCiteEl.setAttribute('aria-expanded', 'false');
      activeCiteEl.removeAttribute('aria-describedby');
    }
    activeCiteEl = anchorEl;
    citePinned = pinned;
    anchorEl.setAttribute('aria-expanded', 'true');
    anchorEl.setAttribute('aria-describedby', 'cite-popover');

    const pages = anchorEl.dataset.pages || '';
    const loc = anchorEl.dataset.loc || '';
    const quote = anchorEl.dataset.quote || '';
    const quoted = anchorEl.dataset.quoted === 'true';
    const head = citeHeadLine({ pages, loc });
    const firstPageMatch = pages.match(/\d+/);
    const firstPage = firstPageMatch ? Number(firstPageMatch[0]) : 0;
    const targetCh = firstPage ? chapterOfPage(firstPage) : null;
    const canJump = Boolean(targetCh && !isViewingChapterInOverview(targetCh.id));

    const quoteEl = quote
      ? h('span', { class: 'cite-popover-quote cite-popover__quote' }, quoted ? `“${quote}”` : quote)
      : null;

    let bodyNode;
    if (canJump) {
      bodyNode = h('button', {
        class: 'cite-popover-body cite-popover__body',
        'aria-label': `原文第 ${firstPage} 页，跳到第${CN[targetCh.chapter_num]}章`,
        onClick: () => {
          closeCitePopover(false);
          jumpToChapter(targetCh.id, true);
        },
      }, h('span', { class: 'cite-popover-head cite-popover__head' }, head), quoteEl);
    } else {
      bodyNode = h('div', { class: 'cite-popover-body cite-popover__body' }, h('span', { class: 'cite-popover-head cite-popover__head' }, head), quoteEl);
    }

    fill(citeMount, bodyNode);
    const openDlgs = [...document.querySelectorAll('dialog[open]')];
    const host = openDlgs.length ? openDlgs.at(-1) : document.body;
    if (citePop.parentElement !== host) {
      if (citePop.matches(':popover-open')) citePop.hidePopover();
      host.appendChild(citePop);
    }
    if (!citePop.matches(':popover-open')) {
      citePop.showPopover();
    }
    positionCitePopover(anchorEl, pointerEvent);
    if (focusInside && canJump) {
      bodyNode.focus({ preventScroll: true });
    }
  }

  /* =========================================================
     6. COMMON UI WIDGET BUILDERS
     ========================================================= */
  function sectionHeading(titleText) {
    return h('h3', { class: 'section-heading' }, h('span', { class: 'section-diamond', 'aria-hidden': 'true' }), titleText);
  }

  function riskBadge(level, size = 'md') {
    const iconName = level === 'normal' ? 'check' : level === 'warning' ? 'warn-circle' : 'triangle';
    return h('span', {
      class: size === 'sm' ? 'risk-badge risk-badge-sm' : 'risk-badge',
      'data-risk': level,
    }, iconSvg(iconName, 'icon-xxs'), RISK_LABEL[level]);
  }

  function toneTag(id) {
    const c = CONST.get(id);
    return h('span', { class: 'tone-tag', 'data-tone': id }, h('span', { class: 'tone-dot', 'aria-hidden': 'true' }), shortName(c));
  }

  function toneInline(id) {
    const c = CONST.get(id);
    return h('span', { class: 'tone-inline', 'data-tone': id }, h('span', { class: 'tone-dot', 'aria-hidden': 'true' }), shortName(c));
  }

  function constSeal(id, size = 'lg') {
    const c = CONST.get(id);
    const cls = size === 'sm' ? 'const-seal const-seal-sm' : size === 'xs' ? 'const-seal const-seal-xs' : 'const-seal';
    return h('span', { class: cls, 'data-tone': id, 'aria-hidden': 'true' }, shortName(c));
  }

  function methodSeal(type, size = 'lg') {
    const cls = size === 'md' ? 'method-seal method-seal-md' : size === 'sm' ? 'method-seal method-seal-sm' : 'method-seal';
    return h('span', { class: cls, 'aria-hidden': 'true' }, METHOD_GLYPH[type]);
  }

  function constChip(id) {
    const c = CONST.get(id);
    return h('button', {
      class: 'click-chip',
      'data-tone': id,
      title: `查看${c.name}档案`,
      onClick: () => jumpToConstitution(id, true),
    }, h('span', { class: 'tone-dot', 'aria-hidden': 'true' }), c.name);
  }

  function remedyChip(id) {
    const r = REMEDY.get(id);
    return h('button', {
      class: 'click-chip remedy-chip',
      title: r.name,
      onClick: () => jumpToRemedy(id, true),
    }, methodSeal(r.method_type, 'sm'), h('span', { class: 'remedy-chip-text' }, r.name));
  }

  function zoneChipBtn(id, inSignDialog = false) {
    const z = ZONE.get(id);
    return h('button', {
      class: 'click-chip',
      onClick: () => {
        if (inSignDialog && state.tab === 'zones') {
          $('sign-dialog').close();
          selectZone(id, true);
        } else {
          jumpToZone(id, true);
        }
      },
    }, z.name);
  }

  /* P-1: PageChip (writes P.xx without repeating 原书) */
  function pageChip(page) {
    const ch = chapterOfPage(page);
    if (!ch) return h('span', { class: 'page-chip' }, `P.${page}`);
    return h('button', {
      class: 'page-chip',
      'aria-label': `原书第 ${page} 页，跳到第${CN[ch.chapter_num]}章`,
      onClick: () => jumpToChapter(ch.id, true),
    }, `P.${page}`);
  }

  /* P-3: Standalone Page Link or Multi-page Line (`原书 P.47 · P.50`) */
  function pageLink(page, withBookPrefix = true) {
    const label = withBookPrefix ? `原书 P.${page}` : `P.${page}`;
    const ch = chapterOfPage(page);
    if (!ch) return h('span', { class: 'caption-note' }, label);
    return h('button', {
      class: 'page-link',
      'aria-label': `原书第 ${page} 页，跳到第${CN[ch.chapter_num]}章`,
      onClick: e => {
        e.stopPropagation();
        jumpToChapter(ch.id, true);
      },
    }, label);
  }

  function pageLinksLine(pages, withBookPrefix = true) {
    const uniq = unique(pages);
    if (!uniq.length) return null;
    const parts = [];
    if (withBookPrefix) parts.push('原书 ');
    uniq.forEach((p, idx) => {
      if (idx > 0) parts.push(' · ');
      parts.push(pageLink(p, false));
    });
    return h('span', { class: 'tabular' }, parts);
  }

  /* Clinical image element with explicit width/height, decoding=async, and fallback */
  function figImg(figId, { alt = '', lazy = true, onFail = null } = {}) {
    const fig = FIG.get(figId);
    const img = h('img', {
      src: fig.src,
      width: fig.width,
      height: fig.height,
      alt: alt || `P.${fig.page} · ${fig.book_caption}`,
      decoding: 'async',
      loading: lazy ? 'lazy' : null,
    });
    img.addEventListener('error', () => {
      state.failedFigs.add(figId);
      if (onFail) onFail();
    }, { once: true });
    return img;
  }

  /* L-a Text Board for vertical cards & compare stage (§3.7) */
  function noFigBoard(visualText, failed = false) {
    return h('div', { class: 'nofig-board' },
      h('span', { class: 'nofig-board-head' },
        iconSvg('doc', 'icon-xs'),
        failed ? '图片未能加载 · 文字描述' : '原书无配图 · 文字描述'),
      visualText ? h('span', { class: 'nofig-board-excerpt' }, plainText(visualText)) : null);
  }

  /* L-b / .fig Compact Sign Row Card (used in 诊, 书, 镜, 测) */
  function signRowCard(sign, scopeIds) {
    const hasFig = Boolean(sign.fig_id && !state.failedFigs.has(sign.fig_id));
    const failed = Boolean(sign.fig_id && state.failedFigs.has(sign.fig_id));
    const card = h('button', {
      class: 'sign-row-card',
      'data-sign-id': sign.id,
      'data-risk': sign.risk_level,
      'data-nofig': hasFig ? null : 'true',
      title: sign.title,
      'aria-label': `${plainText(sign.title)}，${RISK_LABEL[sign.risk_level]}，原书第 ${sign.page} 页${hasFig ? '' : '，原书无配图'}`,
      onClick: () => openSign(sign.id, scopeIds),
    });

    function populate(showFig, isFailed) {
      if (showFig) {
        fill(card,
          h('span', { class: 'sign-row-thumb img-stage' },
            figImg(sign.fig_id, {
              alt: sign.title,
              onFail: () => {
                card.dataset.nofig = 'true';
                populate(false, true);
              },
            })),
          h('span', { class: 'sign-row-main' },
            h('span', { class: 'sign-row-title' }, sign.title),
            h('span', { class: 'sign-row-meta' },
              h('span', { class: 'sign-row-meta-left' }, riskBadge(sign.risk_level, 'sm'), h('span', null, `P.${sign.page}`)))));
      } else {
        const clue = firstSentence(sign.visual_features);
        fill(card,
          h('span', { class: 'sign-row-main' },
            h('span', { class: 'sign-row-title' }, sign.title),
            clue ? h('span', { class: 'sign-row-clue' }, clue) : null,
            h('span', { class: 'sign-row-meta' },
              h('span', { class: 'sign-row-meta-left' }, riskBadge(sign.risk_level, 'sm'), h('span', null, `P.${sign.page}`)),
              h('span', { class: 'nofig-tag' }, iconSvg('doc', 'icon-xxs'), isFailed ? '图片未能加载' : '原书无配图'))));
      }
    }

    populate(hasFig, failed);
    return card;
  }

  function flashEl(el) {
    if (!el || reduceMQ.matches) return;
    el.removeAttribute('data-flash');
    void el.offsetWidth;
    el.setAttribute('data-flash', 'true');
  }

  /* =========================================================
     7. HISTORY STACK, SHEET & CROSS-TAB JUMP CONTRACT (§2.5, §2.9, §2.10)
     ========================================================= */
  const sheetDialog = $('sheet-dialog');
  const signDialog = $('sign-dialog');
  const lightboxDialog = $('lightbox-dialog');
  const searchDialog = $('search-dialog');
  const gateDialog = $('gate-dialog');
  const railDialog = $('rail-dialog');
  const confirmDialog = $('confirm-dialog');
  const dialogReturnFocus = new WeakMap();

  function pushModalHistory(modalName) {
    try {
      history.pushState({ modal: modalName }, '');
    } catch {
      /* file:// fallback safe */
    }
  }

  function closeAllOverlays() {
    closeCitePopover(false);
    for (const pop of document.querySelectorAll('[popover]:popover-open')) {
      pop.hidePopover();
    }
    for (const dlg of document.querySelectorAll('dialog[open]')) {
      dlg.close();
    }
  }

  function makeBackPill(label, onClick) {
    return h('button', {
      class: 'origin-back-btn',
      'aria-label': `返回${label}`,
      onClick,
    }, iconSvg('arrow-left', 'icon-sm'), h('span', { class: 'origin-back-label' }, `返回 · ${label}`));
  }

  function originBackButton() {
    if (!state.origin || state.origin.targetTab !== state.tab) return null;
    return makeBackPill(state.origin.label, backToOrigin);
  }

  function syncAtlasOriginSlot() {
    const slot = $('atlas-origin-slot');
    const btn = originBackButton();
    slot.hidden = !btn;
    fill(slot, btn);
  }

  function refreshOriginTargetUI(targetTab) {
    if (targetTab === 'atlas') syncAtlasOriginSlot();
    else if (targetTab === 'overview') renderInspector();
    else if (targetTab === 'zones') renderZoneDetail();
    else if (targetTab === 'remedies') renderRemedyDetailPanel();
    else if (targetTab === 'mastery') renderCausal(false);
  }

  function clearOriginIfActive() {
    if (!state.origin) return;
    const prevTarget = state.origin.targetTab;
    state.origin = null;
    refreshOriginTargetUI(prevTarget);
  }

  function captureOrigin(targetTab, label) {
    state.origin = {
      fromTab: state.tab,
      targetTab,
      label: label || TAB_TITLE[state.tab],
      scrollTop: window.scrollY,
      sheetType: sheetDialog.open ? (state.sheetCtx?.type || null) : null,
      inspect: { ...state.inspect },
      zone: state.zone,
      zoneSubFilter: { ...state.zoneSubFilter },
      zoneExpanded: state.zoneExpanded,
      atlas: { ...state.atlas },
      atlasSeg: state.atlasSeg,
      pair: state.pair,
      remedy: { ...state.remedy },
      selectedRemedyId: state.selectedRemedyId,
      masteryView: state.masteryView,
      graph: state.graph,
      quizIndex: state.quizIndex,
    };
  }

  function backToOrigin() {
    const orig = state.origin;
    if (!orig) return;
    state.origin = null;
    closeAllOverlays();
    if (orig.targetTab === 'atlas' && orig.fromTab !== 'atlas') {
      state.atlas = orig.atlas;
      state.atlasSeg = orig.atlasSeg || 'signs';
      syncAtlasSeg();
      syncAtlas(false);
    } else if (orig.targetTab !== orig.fromTab) {
      refreshOriginTargetUI(orig.targetTab);
    }
    selectTab(orig.fromTab, false);
    if (orig.fromTab === 'overview') {
      state.ovSeg = orig.inspect.kind === 'constitution' ? 'constitutions' : 'chapters';
      syncOverviewSeg();
      state.inspect = orig.inspect;
      renderInspector();
      syncListSelectionMarks();
      if (!desktopMQ.matches) openOverviewSheet();
    } else if (orig.fromTab === 'zones') {
      state.zoneSubFilter = orig.zoneSubFilter ? { ...orig.zoneSubFilter } : { risk: 'all', constitution: 'all' };
      state.zoneExpanded = Boolean(orig.zoneExpanded);
      selectZone(orig.zone, false);
    } else if (orig.fromTab === 'wizard') {
      renderWizard();
      if (!desktopMQ.matches && orig.sheetType === 'wizard-readout') {
        openSheet({ type: 'wizard-readout' });
      }
    } else if (orig.fromTab === 'atlas') {
      state.atlas = orig.atlas;
      state.atlasSeg = orig.atlasSeg || 'signs';
      state.pair = orig.pair;
      syncAtlasSeg();
      syncAtlas(false);
      renderCompare();
    } else if (orig.fromTab === 'remedies') {
      state.remedy = orig.remedy;
      state.selectedRemedyId = orig.selectedRemedyId;
      syncRemedyFilters();
      renderRemedyGrid();
      renderRemedyDetailPanel();
      syncListSelectionMarks();
      if (!desktopMQ.matches) openRemedySheet();
    } else if (orig.fromTab === 'mastery') {
      state.graph = orig.graph;
      state.quizIndex = orig.quizIndex;
      setMasteryView(orig.masteryView);
      renderQuiz();
      if (!desktopMQ.matches && orig.sheetType === 'causal-node') {
        openSheet({ type: 'causal-node' });
      }
    }
    requestAnimationFrame(() => window.scrollTo({ top: orig.scrollTop, behavior: 'auto' }));
  }

  function openSheet(ctx, triggerEl = document.activeElement) {
    closeCitePopover(false);
    state.sheetCtx = ctx;
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(sheetDialog, triggerEl);
    sheetDialog.dataset.compact = ctx.compact ? 'true' : '';
    if (!ctx.compact) sheetDialog.removeAttribute('data-compact');
    renderActiveSheet();
    if (!sheetDialog.open) {
      sheetDialog.showModal();
      pushModalHistory('sheet');
    }
    syncListSelectionMarks();
  }

  function renderActiveSheet({ preserveScroll = false } = {}) {
    const ctx = state.sheetCtx;
    if (!ctx) return;
    const headLeft = $('sheet-head-left');
    const subbar = $('sheet-subbar');
    const body = $('sheet-body');
    const foot = $('sheet-foot');
    const prevBodyScroll = preserveScroll ? body.scrollTop : 0;
    subbar.hidden = true;
    fill(subbar);

    if (ctx.type === 'overview') {
      const isChap = state.inspect.kind === 'chapter';
      const list = isChap ? KB.chapters : KB.constitutions;
      const idx = list.findIndex(x => x.id === state.inspect.id);
      const item = list[idx];
      const overline = isChap
        ? `第${CN[item.chapter_num]}章 · 原书 P.${item.page_start}–${item.page_end}`
        : `第${CN[CHAPTER.get(item.chapter_id).chapter_num]}章 · 原书 P.${item.page_start}–${item.page_end}`;
      fill(headLeft,
        originBackButton() || (ctx.localOrigin ? makeBackPill(ctx.localOrigin.label, () => {
          const lo = ctx.localOrigin;
          ctx.localOrigin = null;
          state.inspect = { kind: lo.kind, id: lo.id };
          state.constSignsExpanded = false;
          renderInspector();
          renderActiveSheet();
          requestAnimationFrame(() => { body.scrollTop = lo.scrollTop; });
        }) : null),
        h('span', { class: 'sheet-overline', id: 'sheet-title' }, overline));
      fill(body, ...(isChap ? buildChapterDetailNodes(item, true) : buildConstitutionDetailNodes(item, true)));
      if (!preserveScroll) body.scrollTop = 0;
      foot.hidden = false;
      const prevLabel = isChap ? '‹ 上一章' : '‹ 上一体质';
      const nextLabel = isChap ? '下一章 ›' : '下一体质 ›';
      fill(foot,
        h('button', {
          class: 'btn btn-ghost',
          disabled: idx <= 0,
          onClick: () => {
            ctx.localOrigin = null;
            state.origin = null;
            state.constSignsExpanded = false;
            state.inspect = { kind: state.inspect.kind, id: list[idx - 1].id };
            renderInspector();
            renderActiveSheet();
            syncListSelectionMarks();
          },
        }, prevLabel),
        h('span', { class: 'sheet-foot-count' }, `${idx + 1} / ${list.length}`),
        h('button', {
          class: 'btn btn-primary',
          disabled: idx >= list.length - 1,
          onClick: () => {
            ctx.localOrigin = null;
            state.origin = null;
            state.constSignsExpanded = false;
            state.inspect = { kind: state.inspect.kind, id: list[idx + 1].id };
            renderInspector();
            renderActiveSheet();
            syncListSelectionMarks();
          },
        }, nextLabel));
    } else if (ctx.type === 'wizard-readout') {
      const pickedCount = state.choices.size;
      fill(headLeft,
        h('span', { class: 'sheet-overline', 'data-tool': 'true', id: 'sheet-title' }, '实时分路解读'),
        h('span', { class: 'caption-note' }, `已完成 ${pickedCount} / ${STEPS.length} 步`));
      const ro = buildReadoutParts(true);
      subbar.hidden = false;
      fill(subbar, ...ro.anchors);
      fill(body, h('div', { class: 'detail-stack' }, ro.sections));
      foot.hidden = false;
      const allDone = pickedCount >= STEPS.length;
      fill(foot,
        h('button', {
          class: 'btn btn-ghost',
          onClick: () => {
            resetWizard();
            sheetDialog.close();
          },
        }, '重新开始'),
        h('span', { class: 'sheet-foot-count' }, `${pickedCount} / ${STEPS.length} 步`),
        h('button', {
          class: 'btn btn-primary',
          onClick: () => sheetDialog.close(),
        }, allDone ? '回到步骤' : '继续选择'));
    } else if (ctx.type === 'atlas-filter') {
      fill(headLeft, h('span', { class: 'sheet-overline', 'data-tool': 'true', id: 'sheet-title' }, '筛选'));
      const tagCounts = getAtlasTagOptions();
      const radioGroup = (label, key, items, withTone = false) => h('section', { style: 'margin-bottom: 20px;' },
        h('p', { class: 'caption-note', style: 'font-weight: 700; margin-bottom: 8px;' }, label),
        h('div', { class: 'chip-wrap', role: 'radiogroup', 'aria-label': label },
          items.map(([val, txt]) => {
            const on = state.atlas[key] === val;
            return h('button', {
              class: 'sub-filter-chip',
              role: 'radio',
              'aria-checked': String(on),
              'data-tone': withTone && val !== 'all' ? val : null,
              style: 'height: 36px; padding-inline: 14px; font-size: 14px;',
              onClick: () => {
                state.atlas[key] = val;
                syncAtlas();
                renderActiveSheet();
              },
            },
            on ? iconSvg('check', 'icon-xs') : null,
            withTone && val !== 'all' ? h('span', { class: 'tone-dot', 'aria-hidden': 'true' }) : null,
            txt);
          })));
      fill(body,
        radioGroup('体质', 'constitution', [['all', '全部'], ...KB.constitutions.map(c => [c.id, shortName(c)])], true),
        radioGroup('舌面分区', 'zone', [['all', '全部'], ...KB.tongue_zones.map(z => [z.id, z.name])]),
        radioGroup('预警标签', 'tag', [['all', '全部'], ...tagCounts.map(([t]) => [t, t])]));
      const filtered = getFilteredAtlasSigns();
      const isDefault = Object.entries(ATLAS_DEFAULT).every(([k, v]) => state.atlas[k] === v);
      foot.hidden = false;
      fill(foot,
        h('button', {
          class: 'btn btn-ghost',
          style: 'flex: 1;',
          disabled: isDefault,
          onClick: () => {
            state.atlas = { ...ATLAS_DEFAULT };
            syncAtlas();
            renderActiveSheet();
          },
        }, '重置'),
        h('button', {
          class: 'btn btn-primary',
          style: 'flex: 2;',
          disabled: filtered.length === 0,
          onClick: () => sheetDialog.close(),
        }, filtered.length ? `查看 ${filtered.length} 种舌象` : '没有符合条件的舌象'));
    } else if (ctx.type === 'remedy-const') {
      fill(headLeft, h('span', { class: 'sheet-overline', 'data-tool': 'true', id: 'sheet-title' }, '按适用体质筛选'));
      const opts = [['all', '全部体质', KB.remedies.length], ...KB.constitutions.map(c => [
        c.id,
        c.name,
        KB.remedies.filter(r => r.constitution_ids.includes(c.id)).length,
      ])];
      fill(body, h('div', { style: 'display: flex; flex-direction: column; gap: 4px;' },
        opts.map(([val, name, cnt]) => {
          const on = state.remedy.constitution === val;
          return h('button', {
            class: 'filter-pop-opt',
            style: 'min-height: 48px;',
            'aria-selected': String(on),
            'data-tone': val !== 'all' ? val : null,
            onClick: () => {
              state.remedy.constitution = val;
              syncRemedyFilters();
              renderRemedyGrid();
              sheetDialog.close();
            },
          },
          h('span', { style: 'display: inline-flex; align-items: center; gap: 8px;' },
            val !== 'all' ? h('span', { class: 'tone-dot', 'aria-hidden': 'true' }) : null,
            name),
          h('span', { class: 'caption-note' }, `${cnt} 方`));
        })));
      foot.hidden = true;
    } else if (ctx.type === 'remedy-detail') {
      const list = getFilteredRemedies();
      const pool = list.length ? list : KB.remedies;
      let idx = pool.findIndex(r => r.id === state.selectedRemedyId);
      if (idx === -1) idx = 0;
      const r = pool[idx];
      fill(headLeft,
        originBackButton(),
        h('span', { class: 'sheet-overline', id: 'sheet-title' },
          `${METHOD_LABEL[r.method_type]} · `,
          pageLink(r.page, true)));
      fill(body, ...buildRemedyDetailNodes(r, true));
      if (!preserveScroll) body.scrollTop = 0;
      foot.hidden = false;
      fill(foot,
        h('button', {
          class: 'btn btn-ghost',
          disabled: idx <= 0,
          onClick: () => {
            state.selectedRemedyId = pool[idx - 1].id;
            renderRemedyDetailPanel();
            renderActiveSheet();
            syncListSelectionMarks();
          },
        }, '‹ 上一方'),
        h('span', { class: 'sheet-foot-count' }, `${idx + 1} / ${pool.length}`),
        h('button', {
          class: 'btn btn-primary',
          disabled: idx >= pool.length - 1,
          onClick: () => {
            state.selectedRemedyId = pool[idx + 1].id;
            renderRemedyDetailPanel();
            renderActiveSheet();
            syncListSelectionMarks();
          },
        }, '下一方 ›'));
    } else if (ctx.type === 'causal-node') {
      const graph = CAUSAL.find(g => g.id === state.graph);
      const curId = state.selectedNodeByGraph.get(graph.id);
      const idx = graph.nodes.findIndex(n => n.id === curId);
      const node = graph.nodes[idx];
      const ups = graph.edges.filter(e => e.to === node.id).map(e => e.from);
      const downs = graph.edges.filter(e => e.from === node.id).map(e => e.to);
      fill(headLeft,
        originBackButton(),
        h('span', { class: 'sheet-overline', id: 'sheet-title' }, `${graph.short} · 节点 ${idx + 1} / ${graph.nodes.length}`));
      fill(body, ...buildCausalDetailNodes(graph, node, true));
      if (!preserveScroll) body.scrollTop = 0;
      foot.hidden = false;
      fill(foot,
        h('button', {
          class: 'btn btn-ghost',
          disabled: !ups.length,
          onClick: () => {
            selectNode(ups[0], false);
            renderActiveSheet();
          },
        }, '‹ 上游'),
        h('span', { class: 'sheet-foot-count' }, `${idx + 1} / ${graph.nodes.length}`),
        h('button', {
          class: 'btn btn-primary',
          disabled: !downs.length,
          onClick: () => {
            selectNode(downs[0], false);
            renderActiveSheet();
          },
        }, '下游 ›'));
    }
    if (preserveScroll) {
      body.scrollTop = prevBodyScroll;
    }
  }

  /* =========================================================
     8. TAB NAVIGATION & CROSS-TAB JUMP FUNCTIONS
     ========================================================= */
  const navTabs = [...document.querySelectorAll('.nav-tab[role="tab"]')];

  function selectTab(name, resetScroll = false) {
    if (state.tab !== name) {
      state.tabScroll[state.tab] = window.scrollY;
    }
    closeCitePopover(false);
    state.tab = name;
    for (const tab of navTabs) {
      const on = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(on));
      if (on) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
      $(tab.getAttribute('aria-controls')).hidden = !on;
    }
    if (name === 'zones') requestAnimationFrame(updateZoneScrollHint);
    if (name === 'overview') requestAnimationFrame(syncOverviewAsideSticky);
    if (name === 'remedies') requestAnimationFrame(syncRemedyAsideSticky);
    if (name === 'mastery' && state.masteryView === 'causal') requestAnimationFrame(() => renderCausal(false));
    if (!desktopMQ.matches) {
      const targetY = resetScroll ? 0 : (state.tabScroll[name] ?? 0);
      window.scrollTo({ top: targetY, behavior: 'auto' });
    }
    if (name === 'atlas') syncAtlasSeg();
  }

  function jumpToChapter(id, recordOrigin = false) {
    const label = currentOriginLabel();
    const sameOverviewConst = state.tab === 'overview' && state.inspect.kind === 'constitution';
    const localOrigin = (recordOrigin && sameOverviewConst && !desktopMQ.matches && sheetDialog.open)
      ? {
        kind: 'constitution',
        id: state.inspect.id,
        label: CONST.get(state.inspect.id).name,
        scrollTop: $('sheet-body').scrollTop,
      }
      : null;
    if (recordOrigin && (state.tab !== 'overview' || (sameOverviewConst && !localOrigin))) {
      captureOrigin('overview', label);
    }
    closeAllOverlays();
    state.ovSeg = 'chapters';
    syncOverviewSeg();
    state.inspect = { kind: 'chapter', id };
    selectTab('overview', false);
    renderInspector();
    syncListSelectionMarks();
    if (!desktopMQ.matches) {
      openSheet({ type: 'overview', localOrigin });
    } else {
      const row = document.querySelector(`[data-inspect="chapter:${id}"]`);
      if (row) {
        row.scrollIntoView({ block: 'nearest' });
        flashEl(row);
      }
    }
  }

  function jumpToConstitution(id, recordOrigin = false) {
    const label = currentOriginLabel();
    if (recordOrigin && state.tab !== 'overview') captureOrigin('overview', label);
    closeAllOverlays();
    state.ovSeg = 'constitutions';
    state.constSignsExpanded = false;
    syncOverviewSeg();
    state.inspect = { kind: 'constitution', id };
    selectTab('overview', false);
    renderInspector();
    syncListSelectionMarks();
    if (!desktopMQ.matches) {
      openOverviewSheet();
    } else {
      const seal = document.querySelector(`[data-inspect="constitution:${id}"]`);
      if (seal) flashEl(seal);
    }
  }

  function jumpToZone(id, recordOrigin = false) {
    const label = currentOriginLabel();
    if (recordOrigin && state.tab !== 'zones') captureOrigin('zones', label);
    closeAllOverlays();
    selectTab('zones', false);
    selectZone(id, true);
  }

  function jumpToSign(id) {
    closeAllOverlays();
    const curFiltered = getFilteredAtlasSigns();
    if (!curFiltered.some(sItem => sItem.id === id)) {
      state.atlas = { ...ATLAS_DEFAULT };
      syncAtlas();
    }
    state.atlasSeg = 'signs';
    syncAtlasSeg();
    selectTab('atlas', false);
    const scope = getFilteredAtlasSigns().map(sItem => sItem.id);
    const card = document.querySelector(`#sign-grid [data-sign-id="${id}"]`);
    if (card) card.scrollIntoView({ block: 'nearest' });
    openSign(id, scope, card);
  }

  function jumpToAtlasByConst(constId, recordOrigin = false) {
    const label = currentOriginLabel();
    if (recordOrigin) captureOrigin('atlas', label);
    closeAllOverlays();
    state.atlas = { ...ATLAS_DEFAULT, constitution: constId };
    state.atlasSeg = 'signs';
    syncAtlasSeg();
    selectTab('atlas', true);
    syncAtlas();
  }

  function jumpToRemedy(id, recordOrigin = false) {
    const label = currentOriginLabel();
    if (recordOrigin && state.tab !== 'remedies') captureOrigin('remedies', label);
    closeAllOverlays();
    if (!getFilteredRemedies().some(r => r.id === id)) {
      state.remedy = { ...REMEDY_DEFAULT };
      syncRemedyFilters();
      renderRemedyGrid();
    }
    state.selectedRemedyId = id;
    selectTab('remedies', false);
    renderRemedyDetailPanel();
    syncListSelectionMarks();
    const row = document.querySelector(`#remedy-grid [data-remedy-id="${id}"]`);
    if (desktopMQ.matches) {
      if (row) {
        row.scrollIntoView({ block: 'nearest' });
        flashEl(row);
      }
    } else {
      if (row) row.scrollIntoView({ block: 'center' });
      openRemedySheet(row);
    }
  }

  function jumpToHerb(herbName) {
    closeAllOverlays();
    state.remedy = { ...REMEDY_DEFAULT, keyword: herbName };
    syncRemedyFilters();
    renderRemedyGrid();
    const filtered = getFilteredRemedies();
    if (filtered.length) {
      state.selectedRemedyId = filtered[0].id;
      renderRemedyDetailPanel();
    }
    selectTab('remedies', true);
    syncListSelectionMarks();
  }

  function currentOriginLabel() {
    if (state.tab === 'overview') {
      return state.inspect.kind === 'chapter'
        ? `第${CN[CHAPTER.get(state.inspect.id).chapter_num]}章`
        : CONST.get(state.inspect.id).name;
    }
    if (state.tab === 'remedies') return REMEDY.get(state.selectedRemedyId)?.name || TAB_TITLE.remedies;
    return TAB_TITLE[state.tab];
  }

  /* =========================================================
     9. TAB 1: 书 · 全书骨架
     ========================================================= */
  function syncOverviewSeg() {
    for (const btn of document.querySelectorAll('#overview-seg [data-ov-seg]')) {
      btn.setAttribute('aria-selected', String(btn.dataset.ovSeg === state.ovSeg));
    }
    $('overview-chapters-sec').dataset.mobileHidden = String(state.ovSeg !== 'chapters');
    if (state.ovSeg === 'chapters') $('overview-chapters-sec').removeAttribute('data-mobile-hidden');
    $('overview-consts-sec').dataset.mobileHidden = String(state.ovSeg !== 'constitutions');
    if (state.ovSeg === 'constitutions') $('overview-consts-sec').removeAttribute('data-mobile-hidden');
  }

  function renderChapterTree() {
    const general = KB.chapters.filter(c => !CONST_BY_CHAPTER.has(c.id));
    const special = KB.chapters.filter(c => CONST_BY_CHAPTER.has(c.id));
    const range = list => `P.${list[0].page_start}–${list.at(-1).page_end}`;
    const renderGroup = (title, list) => h('section', { class: 'tree-group' },
      h('div', { class: 'tree-group-head' },
        h('h2', { class: 'group-label' }, title),
        h('span', { class: 'caption-note' }, range(list))),
      h('ol', { class: 'tree-card' }, list.map(ch => {
        const c = CONST_BY_CHAPTER.get(ch.id);
        return h('li', { class: 'tree-item' },
          h('button', {
            class: 'chapter-row',
            'data-inspect': `chapter:${ch.id}`,
            onClick: e => handleOverviewInspect('chapter', ch.id, e.currentTarget),
          },
          h('span', { class: 'seq-ring' }, CN[ch.chapter_num]),
          h('span', { class: 'chapter-row-main' },
            h('span', { class: 'chapter-row-title' }, ch.title),
            h('span', { class: 'chapter-row-meta' }, `P.${ch.page_start}–${ch.page_end} · ${ch.key_takeaways.length} 条要点`)),
          c ? toneTag(c.id) : null,
          iconSvg('chevron-right', 'icon-sm row-chevron')));
      })));
    fill($('chapter-tree'), renderGroup('总论 · 观舌基础', general), renderGroup('各论 · 七大体质', special));
  }

  function renderConstGrid() {
    fill($('const-grid'), ...KB.constitutions.map(c => {
      const ch = CHAPTER.get(c.chapter_id);
      const signCount = (SIGNS_BY_CONST.get(c.id) ?? []).length;
      const remCount = c.primary_remedy_ids.length;
      return h('button', {
        class: 'const-item',
        'data-tone': c.id,
        'data-inspect': `constitution:${c.id}`,
        title: `${c.name} · 第${CN[ch.chapter_num]}章 · ${signCount} 象 · ${remCount} 方`,
        'aria-label': `${c.name}，第${CN[ch.chapter_num]}章，${signCount} 象 ${remCount} 方`,
        onClick: e => handleOverviewInspect('constitution', c.id, e.currentTarget),
      },
      constSeal(c.id, 'lg'),
      h('span', { class: 'const-item-body' },
        h('span', { class: 'const-item-top' },
          h('span', { class: 'const-item-name' }, c.name),
          h('span', { class: 'const-item-count' }, `${signCount} 象 · ${remCount} 方`)),
        h('span', { class: 'const-item-alias' }, c.alias),
        h('span', { class: 'const-item-feat' }, plainText(c.core_tongue_features[0] || ''))),
      iconSvg('chevron-right', 'icon-sm row-chevron'));
    }));
  }

  function handleOverviewInspect(kind, id, triggerEl) {
    state.origin = null;
    state.constSignsExpanded = false;
    state.inspect = { kind, id };
    renderInspector();
    syncListSelectionMarks();
    if (!desktopMQ.matches) {
      openOverviewSheet(triggerEl);
    }
  }

  function openOverviewSheet(triggerEl) {
    openSheet({ type: 'overview', localOrigin: null }, triggerEl);
  }

  function buildChapterDetailNodes(ch, inSheet = false) {
    const c = CONST_BY_CHAPTER.get(ch.id);
    const idx = KB.chapters.findIndex(x => x.id === ch.id);
    const nextCh = KB.chapters[idx + 1] || null;
    const constSignCount = c ? (SIGNS_BY_CONST.get(c.id) ?? []).length : 0;

    const head = h('header', { class: 'detail-head' },
      !inSheet ? h('div', { class: 'detail-head-top' },
        h('div', { style: 'display: flex; align-items: center; gap: 10px;' },
          originBackButton(),
          h('p', { class: 'eyebrow' }, `第${CN[ch.chapter_num]}章 · 原书 P.${ch.page_start}–${ch.page_end}`)),
        h('div', { class: 'panel-nav-btns' },
          h('button', {
            class: 'btn-ghost-sm',
            disabled: idx <= 0,
            onClick: () => handleOverviewInspect('chapter', KB.chapters[idx - 1].id),
          }, '‹ 上一章'),
          h('button', {
            class: 'btn-ghost-sm',
            disabled: idx >= KB.chapters.length - 1,
            onClick: () => handleOverviewInspect('chapter', KB.chapters[idx + 1].id),
          }, '下一章 ›'))) : null,
      h('h2', { class: 'detail-display' }, ch.title),
      h('p', { class: 'detail-sub' }, ch.subtitle));

    const thesisBlock = h('section', { class: 'embed-accent' },
      h('span', { class: 'embed-accent-label' }, '本章主旨'),
      h('p', { class: 'embed-accent-body' }, richText(ch.core_thesis)));

    const chainBlock = h('section', null,
      sectionHeading('章节脉络'),
      h('ol', { class: 'chain-list' }, ch.chain_of_thought.map((stepTxt, i) => h('li', { class: 'chain-step' },
        h('span', { class: 'chain-no' }, String(i + 1)),
        h('p', { class: 'chain-text' }, richText(stepTxt))))));

    const takeawaysList = h('ul', { class: 'ring-bullet-list' },
      ch.key_takeaways.map(item => h('li', { class: 'ring-bullet-item' }, richText(item))));

    const constLinkCard = c ? h('button', {
      class: 'link-card',
      'data-tone': c.id,
      onClick: () => {
        if (inSheet && state.sheetCtx) {
          state.sheetCtx.localOrigin = {
            kind: 'chapter',
            id: ch.id,
            label: `第${CN[ch.chapter_num]}章`,
            scrollTop: $('sheet-body').scrollTop,
          };
          state.constSignsExpanded = false;
          state.inspect = { kind: 'constitution', id: c.id };
          renderInspector();
          renderActiveSheet();
          syncListSelectionMarks();
        } else {
          handleOverviewInspect('constitution', c.id);
        }
      },
    },
    constSeal(c.id, 'lg'),
    h('span', { class: 'link-card-body' },
      h('span', { class: 'link-card-title' }, c.name),
      h('span', { class: 'caption-note' }, `${constSignCount} 象 · ${c.primary_remedy_ids.length} 方`)),
    iconSvg('chevron-right', 'icon-sm row-chevron')) : null;

    if (inSheet || !wideDeskMQ.matches) {
      return [
        head,
        h('div', { class: 'detail-stack' },
          thesisBlock,
          chainBlock,
          ch.key_takeaways.length ? h('section', null, sectionHeading('本章要点'), takeawaysList) : null,
          constLinkCard ? h('section', null, sectionHeading('对应体质'), h('div', { style: 'margin-top: 8px;' }, constLinkCard)) : null),
      ];
    }

    const aside = h('div', { class: 'detail-aside', 'data-sticky': 'true' },
      ch.key_takeaways.length ? h('section', { class: 'aside-card' },
        sectionHeading('本章要点'),
        takeawaysList) : null,
      constLinkCard,
      nextCh ? h('button', {
        class: 'link-card',
        onClick: () => handleOverviewInspect('chapter', nextCh.id),
      },
      h('span', { class: 'seq-ring' }, CN[nextCh.chapter_num]),
      h('span', { class: 'link-card-body' },
        h('span', { class: 'link-card-title' }, nextCh.title),
        h('span', { class: 'caption-note' }, `下一章 · P.${nextCh.page_start}–${nextCh.page_end}`)),
      iconSvg('chevron-right', 'icon-sm row-chevron')) : null);

    return [
      head,
      h('div', { class: 'detail-wide-grid' },
        h('div', { class: 'detail-stack' }, thesisBlock, chainBlock),
        aside),
    ];
  }

  function buildConstitutionDetailNodes(c, inSheet = false) {
    const ch = CHAPTER.get(c.chapter_id);
    const idx = KB.constitutions.findIndex(x => x.id === c.id);
    const signs = sortSigns(SIGNS_BY_CONST.get(c.id) ?? []);
    const signScope = signs.map(sItem => sItem.id);

    const head = h('header', { class: 'detail-head', 'data-tone': c.id },
      !inSheet ? h('div', { class: 'detail-head-top' },
        h('div', { style: 'display: flex; align-items: center; gap: 10px;' },
          originBackButton(),
          h('p', { class: 'eyebrow' }, `第${CN[ch.chapter_num]}章 · 原书 P.${c.page_start}–${c.page_end}`)),
        h('div', { class: 'panel-nav-btns' },
          h('button', {
            class: 'btn-ghost-sm',
            disabled: idx <= 0,
            onClick: () => handleOverviewInspect('constitution', KB.constitutions[idx - 1].id),
          }, '‹ 上一体质'),
          h('button', {
            class: 'btn-ghost-sm',
            disabled: idx >= KB.constitutions.length - 1,
            onClick: () => handleOverviewInspect('constitution', KB.constitutions[idx + 1].id),
          }, '下一体质 ›'))) : null,
      h('div', { class: 'detail-title-row' },
        constSeal(c.id, 'lg'),
        h('h2', { class: 'detail-display' }, c.name)),
      h('p', { class: 'detail-sub' }, c.alias));

    const bulletSec = (title, items) => {
      if (!items || !items.length) return null;
      return h('section', null,
        sectionHeading(title),
        h('ul', { class: 'ring-bullet-list' }, items.map(txt => h('li', { class: 'ring-bullet-item' }, richText(txt)))));
    };

    const tabooBlock = c.lifestyle_taboos.length ? h('section', { class: 'callout-r2' },
      h('div', { class: 'callout-r2-head' },
        h('span', { class: 'callout-r2-tag' }, iconSvg('ban', 'icon-sm'), '禁忌'),
        h('span', { class: 'callout-r2-tag' }, `${c.lifestyle_taboos.length} 条`)),
      h('ul', { class: 'callout-r2-list' },
        c.lifestyle_taboos.map(txt => h('li', { class: 'callout-r2-item' },
          iconSvg('cross', 'icon-sm'),
          h('span', null, richText(txt)))))) : null;

    const remediesBlock = c.primary_remedy_ids.length ? h('section', null,
      sectionHeading(`首选调理方法 · ${c.primary_remedy_ids.length}`),
      h('div', { class: 'chip-wrap' }, c.primary_remedy_ids.map(remedyChip))) : null;

    const chapterLinkCard = h('button', {
      class: 'link-card',
      onClick: () => {
        if (inSheet && state.sheetCtx) {
          state.sheetCtx.localOrigin = {
            kind: 'constitution',
            id: c.id,
            label: c.name,
            scrollTop: $('sheet-body').scrollTop,
          };
          state.inspect = { kind: 'chapter', id: ch.id };
          renderInspector();
          renderActiveSheet();
          syncListSelectionMarks();
        } else {
          handleOverviewInspect('chapter', ch.id);
        }
      },
    },
    h('span', { class: 'seq-ring' }, CN[ch.chapter_num]),
    h('span', { class: 'link-card-body' },
      h('span', { class: 'link-card-title' }, ch.title),
      h('span', { class: 'caption-note' }, `第${CN[ch.chapter_num]}章 · P.${ch.page_start}–${ch.page_end}`)),
    iconSvg('chevron-right', 'icon-sm row-chevron'));

    let signsSection = null;
    if (signs.length) {
      const canCollapse = inSheet && signs.length > 8;
      const visibleSigns = canCollapse && !state.constSignsExpanded ? signs.slice(0, 8) : signs;
      const listId = inSheet ? 'sheet-const-signs-grid' : 'desk-const-signs-grid';
      const headEl = sectionHeading(`关联原书舌象 · ${signs.length}`);
      const gridEl = h('div', { class: 'sign-row-grid', id: listId }, visibleSigns.map(sItem => signRowCard(sItem, signScope)));
      const toggleBtn = canCollapse ? h('button', {
        class: 'expand-more-btn',
        'aria-expanded': String(state.constSignsExpanded),
        'aria-controls': listId,
        onClick: () => {
          state.constSignsExpanded = !state.constSignsExpanded;
          renderActiveSheet({ preserveScroll: true });
          requestAnimationFrame(() => {
            const newBtn = $('sheet-body').querySelector('.expand-more-btn');
            if (newBtn) newBtn.focus({ preventScroll: true });
          });
        },
      },
      state.constSignsExpanded ? '收起列表' : `展开其余 ${signs.length - 8} 种舌象（共 ${signs.length} 种）`,
      iconSvg(state.constSignsExpanded ? 'chevron-up' : 'chevron-down', 'icon-xs')) : null;

      signsSection = h('section', { class: 'detail-signs-sec' }, headEl, gridEl, toggleBtn);
    }

    const combinedSymptoms = [...c.body_symptoms, ...c.child_symptoms.map(x => `小儿表现：${x}`)];
    const mainStack = h('div', { class: 'detail-stack' },
      bulletSec('病因根源', c.root_causes),
      bulletSec('身体与小儿表现', combinedSymptoms),
      bulletSec('核心舌象', c.core_tongue_features),
      bulletSec('鉴别要点', c.differentiation_notes),
      bulletSec('调理原则', c.conditioning_principles));

    if (inSheet || !wideDeskMQ.matches) {
      return [
        head,
        h('div', { class: 'detail-stack' },
          mainStack,
          tabooBlock,
          remediesBlock,
          chapterLinkCard,
          signsSection),
      ];
    }

    const aside = h('div', { class: 'detail-aside', 'data-sticky': 'true' },
      tabooBlock,
      remediesBlock,
      chapterLinkCard);

    return [
      head,
      h('div', { class: 'detail-wide-grid' }, mainStack, aside),
      signsSection,
    ];
  }

  function syncOverviewAsideSticky() {
    const panel = $('inspector');
    const aside = panel?.querySelector('.detail-aside');
    if (!panel || !aside || !wideDeskMQ.matches) return;
    aside.dataset.sticky = String(aside.offsetHeight <= panel.clientHeight - 64);
  }

  function renderInspector() {
    const { kind, id } = state.inspect;
    const box = $('inspector');
    fill(box, ...(kind === 'chapter'
      ? buildChapterDetailNodes(CHAPTER.get(id), false)
      : buildConstitutionDetailNodes(CONST.get(id), false)));
    box.scrollTop = 0;
    requestAnimationFrame(syncOverviewAsideSticky);
  }

  function syncListSelectionMarks() {
    const showOvMark = desktopMQ.matches || Boolean(sheetDialog.open && state.sheetCtx?.type === 'overview');
    const ovKey = `${state.inspect.kind}:${state.inspect.id}`;
    for (const el of document.querySelectorAll('[data-inspect]')) {
      const on = showOvMark && el.dataset.inspect === ovKey;
      el.dataset.selected = String(on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    }
    const showRemMark = desktopMQ.matches || Boolean(sheetDialog.open && state.sheetCtx?.type === 'remedy-detail');
    for (const el of document.querySelectorAll('#remedy-grid [data-remedy-id]')) {
      const on = showRemMark && el.dataset.remedyId === state.selectedRemedyId;
      el.dataset.selected = String(on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    }
  }

  /* =========================================================
     10. TAB 2: 诊 · 舌面分区 (§6.2 & §9.1)
     ========================================================= */
  const ZONE_GEO_COMPACT = {
    viewBox: '26 0 308 244',
    bodyPath: 'M46,54 C46,22 80,8 150,8 C220,8 254,22 254,54 C258,150 226,238 150,238 C74,238 42,150 46,54 Z',
    midline: [150, 16, 150, 230],
    axisRoot: [38, 18],
    axisTip: [214, 240],
    ellipses: {
      root: { cx: 150, cy: 46, rx: 54, ry: 26, label: '肾·膀胱', ly: 51 },
      right: { cx: 74, cy: 114, rx: 22, ry: 50, label: '胆', ly: 112, sub: '舌右侧', sy: 130 },
      center: { cx: 150, cy: 110, rx: 40, ry: 32, label: '脾·胃', ly: 115 },
      left: { cx: 226, cy: 114, rx: 22, ry: 50, label: '肝', ly: 112, sub: '舌左侧', sy: 130 },
      front: { cx: 150, cy: 166, rx: 40, ry: 18, label: '肺', ly: 171, hit: [106, 144, 88, 44] },
      tip: { cx: 150, cy: 210, rx: 38, ry: 18, label: '心·小肠', ly: 215, hit: [108, 188, 84, 44] },
    },
    wholeBox: { x: 268, y: 8, w: 66, h: 65, tx: 301, ty: 28, iconPath: 'M288,43 C288,37 294,35 301,35 C308,35 314,37 314,43 C315,54 310,63 301,63 C292,63 287,54 288,43 Z' },
    subBox: { x: 268, y: 158, w: 66, h: 86, tx: 301, ty: 179, dome: 'M281,232 A20,24 0 0 1 321,232 Z', v1: [295, 216, 295, 230], v2: [307, 216, 307, 230] },
  };

  const ZONE_GEO_TALL = {
    viewBox: '28 0 420 528',
    bodyPath: 'M50,84 C50,44 96,26 200,26 C304,26 350,44 350,84 C356,260 330,504 200,504 C70,504 44,260 50,84 Z',
    midline: [200, 38, 200, 492],
    axisRoot: [42, 36],
    axisTip: [286, 510],
    ellipses: {
      root: { cx: 200, cy: 106, rx: 78, ry: 54, label: '肾·膀胱', ly: 112 },
      right: { cx: 96, cy: 252, rx: 31, ry: 104, label: '胆', ly: 250, sub: '舌右侧', sy: 268 },
      center: { cx: 200, cy: 252, rx: 56, ry: 66, label: '脾·胃', ly: 258 },
      left: { cx: 304, cy: 252, rx: 31, ry: 104, label: '肝', ly: 250, sub: '舌左侧', sy: 268 },
      front: { cx: 200, cy: 368, rx: 58, ry: 30, label: '肺', ly: 374 },
      tip: { cx: 200, cy: 446, rx: 50, ry: 26, label: '心·小肠', ly: 452 },
    },
    wholeBox: { x: 360, y: 26, w: 88, h: 93, tx: 404, ty: 51, iconPath: 'M386,74 C386,66 394,64 404,64 C414,64 422,66 422,74 C423,90 416,102 404,102 C392,102 385,90 386,74 Z' },
    subBox: { x: 360, y: 412, w: 88, h: 104, tx: 404, ty: 437, dome: 'M378,500 A26,32 0 0 1 430,500 Z', v1: [396, 478, 396, 497], v2: [412, 478, 412, 497] },
  };

  function buildZoneMap() {
    const geo = tabletUpMQ.matches ? ZONE_GEO_TALL : ZONE_GEO_COMPACT;
    const bySvg = byId(KB.tongue_zones, 'svg_zone_id');
    const whole = bySvg.get('whole');
    const sub = bySvg.get('sublingual');
    const signCountOf = zId => (SIGNS_BY_ZONE.get(zId) ?? []).length;

    const wholeBoxEl = s('g', {
      class: 'zone-box-group',
      'data-zone': whole.id,
      role: 'button',
      tabindex: '0',
      'aria-pressed': String(state.zone === whole.id),
      'aria-label': `${whole.name}：全舌，关联舌象 ${signCountOf(whole.id)}`,
    },
    s('rect', { class: 'zone-box-card', x: geo.wholeBox.x, y: geo.wholeBox.y, width: geo.wholeBox.w, height: geo.wholeBox.h, rx: 12 }),
    s('text', { class: 'zone-box-text', x: geo.wholeBox.tx, y: geo.wholeBox.ty }, '全舌'),
    s('path', { class: 'zone-box-icon', d: geo.wholeBox.iconPath }));

    const subBoxEl = s('g', {
      class: 'zone-box-group',
      'data-zone': sub.id,
      role: 'button',
      tabindex: '0',
      'aria-pressed': String(state.zone === sub.id),
      'aria-label': `${sub.name}：舌下络脉，关联舌象 ${signCountOf(sub.id)}`,
    },
    s('rect', { class: 'zone-box-card', x: geo.subBox.x, y: geo.subBox.y, width: geo.subBox.w, height: geo.subBox.h, rx: 12 }),
    s('text', { class: 'zone-box-text', x: geo.subBox.tx, y: geo.subBox.ty }, '舌下络脉'),
    s('path', { class: 'zone-box-icon', d: geo.subBox.dome }),
    s('line', { class: 'zone-vein-line', x1: geo.subBox.v1[0], y1: geo.subBox.v1[1], x2: geo.subBox.v1[2], y2: geo.subBox.v1[3] }),
    s('line', { class: 'zone-vein-line', x1: geo.subBox.v2[0], y1: geo.subBox.v2[1], x2: geo.subBox.v2[2], y2: geo.subBox.v2[3] }));

    const orderedSvgIds = ['tip', 'front', 'center', 'left', 'right', 'root'];
    const ellipseGroups = orderedSvgIds.map(svgId => {
      const zone = bySvg.get(svgId);
      const e = geo.ellipses[svgId];
      return s('g', {
        class: 'zone-region',
        'data-zone': zone.id,
        role: 'button',
        tabindex: '0',
        'aria-pressed': String(state.zone === zone.id),
        'aria-label': `${zone.name}：${e.label}，关联舌象 ${signCountOf(zone.id)}`,
      },
      e.hit ? s('rect', { class: 'zone-hit-pad', x: e.hit[0], y: e.hit[1], width: e.hit[2], height: e.hit[3], rx: 8 }) : null,
      s('ellipse', { class: 'zone-shape', cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry }),
      s('text', { class: 'zone-label', x: e.cx, y: e.ly }, e.label),
      e.sub ? s('text', { class: 'zone-sublabel', x: e.cx, y: e.sy }, e.sub) : null);
    });

    const bodyPathEl = s('path', {
      class: 'tongue-body',
      d: geo.bodyPath,
      'data-zone-bg': whole.id,
      'data-whole-selected': String(state.zone === whole.id),
    });
    bodyPathEl.addEventListener('pointerenter', () => {
      if (hoverMQ.matches) wholeBoxEl.dataset.hover = 'true';
    });
    bodyPathEl.addEventListener('pointerleave', () => {
      wholeBoxEl.removeAttribute('data-hover');
    });

    const svg = s('svg', {
      class: 'zone-svg',
      viewBox: geo.viewBox,
      role: 'group',
      'aria-label': '舌面分区图',
    },
    s('text', { class: 'zone-axis', x: geo.axisRoot[0], y: geo.axisRoot[1] }, '舌根'),
    bodyPathEl,
    s('line', { class: 'tongue-midline', x1: geo.midline[0], y1: geo.midline[1], x2: geo.midline[2], y2: geo.midline[3] }),
    ...ellipseGroups,
    subBoxEl,
    wholeBoxEl,
    s('text', { class: 'zone-axis', x: geo.axisTip[0], y: geo.axisTip[1] }, '舌尖'));

    svg.addEventListener('click', e => {
      const hitZone = e.target.closest('[data-zone]');
      if (hitZone) {
        selectZone(hitZone.dataset.zone, true);
        return;
      }
      if (e.target.closest('[data-zone-bg]')) {
        selectZone(whole.id, true);
      }
    });

    svg.addEventListener('keydown', e => {
      const hitZone = e.target.closest('[data-zone]');
      if (hitZone && isActivationKey(e)) {
        e.preventDefault();
        selectZone(hitZone.dataset.zone, true);
      }
    });

    fill($('zone-map'), svg);

    const book = FIG.get('fig_p029');
    fill($('zone-book'),
      h('div', { class: 'zone-book-pad' },
        figImg(book.fig_id, { alt: book.book_caption, lazy: false })),
      h('figcaption', { class: 'caption-note' }, `P.${book.page} · ${book.book_caption}`));

    fill($('zone-chips'), ...KB.tongue_zones.map(zone => h('button', {
      class: 'switch-chip',
      'data-zone': zone.id,
      'aria-pressed': String(zone.id === state.zone),
      onClick: () => selectZone(zone.id, true),
    },
    h('span', null, zone.name),
    h('span', { class: 'switch-chip-count' }, String(signCountOf(zone.id))))));

    syncZoneSelectionDOM();
  }

  function syncZoneMode() {
    $('zone-map').hidden = state.zoneMode === 'book';
    $('zone-book').hidden = state.zoneMode !== 'book';
    for (const btn of document.querySelectorAll('#zone-mode [data-mode]')) {
      const on = btn.dataset.mode === state.zoneMode;
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-selected', String(on));
    }
  }

  function syncZoneSelectionDOM() {
    const id = state.zone;
    for (const el of document.querySelectorAll('#zone-map [data-zone]')) {
      const on = el.dataset.zone === id;
      el.dataset.selected = String(on);
      el.setAttribute('aria-pressed', String(on));
    }
    const bodyPath = document.querySelector('#zone-map .tongue-body');
    if (bodyPath) {
      bodyPath.dataset.wholeSelected = String(id === 'zone_whole');
    }
    for (const el of document.querySelectorAll('#zone-chips [data-zone]')) {
      const on = el.dataset.zone === id;
      el.setAttribute('aria-pressed', String(on));
      if (on && !tabletUpMQ.matches) {
        const rail = $('zone-chips');
        if (rail) {
          rail.scrollLeft = Math.max(0, el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2);
        }
      }
    }
  }

  function selectZone(id, userTriggered = false) {
    const changed = state.zone !== id;
    state.zone = id;
    if (changed) {
      state.zoneSubFilter = { risk: 'all', constitution: 'all' };
      state.zoneExpanded = false;
    }
    syncZoneSelectionDOM();
    renderZoneDetail();
    if (userTriggered) {
      if (desktopMQ.matches) {
        $('zone-detail').scrollTop = 0;
      } else {
        const barWrap = $('zone-bar-wrap');
        const detailShell = document.querySelector('.zone-detail-shell');
        if (barWrap && detailShell && barWrap.getBoundingClientRect().top <= 58) {
          const topY = window.scrollY + detailShell.getBoundingClientRect().top - 108;
          window.scrollTo({ top: Math.max(0, topY), behavior: scrollMode() });
        }
      }
    }
  }

  function renderZoneDetail() {
    const zone = ZONE.get(state.zone);
    const allSigns = sortSigns(SIGNS_BY_ZONE.get(zone.id) ?? []);
    const N = allSigns.length;
    const sf = state.zoneSubFilter;
    const isSubFiltered = sf.risk !== 'all' || sf.constitution !== 'all';
    const matching = allSigns.filter(sItem => (sf.risk === 'all' || sItem.risk_level === sf.risk)
      && (sf.constitution === 'all' || sItem.constitution_ids.includes(sf.constitution)));

    let filterBarNode = null;
    if (N > 8) {
      const counts = {
        high_alert: allSigns.filter(x => x.risk_level === 'high_alert').length,
        warning: allSigns.filter(x => x.risk_level === 'warning').length,
        normal: allSigns.filter(x => x.risk_level === 'normal').length,
      };
      const involvedConsts = unique(allSigns.flatMap(x => x.constitution_ids))
        .toSorted((a, b) => (CONST_ORDER.get(a) ?? 99) - (CONST_ORDER.get(b) ?? 99));

      const riskBtns = [
        h('button', {
          class: 'sub-filter-chip',
          role: 'radio',
          'aria-checked': String(sf.risk === 'all'),
          onClick: () => setZoneSubFilter('risk', 'all'),
        }, `全部 ${N}`),
      ];
      if (counts.high_alert > 0) {
        riskBtns.push(h('button', {
          class: 'sub-filter-chip',
          role: 'radio',
          'data-risk': 'high_alert',
          'aria-checked': String(sf.risk === 'high_alert'),
          onClick: () => setZoneSubFilter('risk', 'high_alert'),
        }, iconSvg('triangle', 'icon-xxs'), `高危 ${counts.high_alert}`));
      }
      if (counts.warning > 0) {
        riskBtns.push(h('button', {
          class: 'sub-filter-chip',
          role: 'radio',
          'data-risk': 'warning',
          'aria-checked': String(sf.risk === 'warning'),
          onClick: () => setZoneSubFilter('risk', 'warning'),
        }, iconSvg('warn-circle', 'icon-xxs'), `警示 ${counts.warning}`));
      }
      if (counts.normal > 0) {
        riskBtns.push(h('button', {
          class: 'sub-filter-chip',
          role: 'radio',
          'data-risk': 'normal',
          'aria-checked': String(sf.risk === 'normal'),
          onClick: () => setZoneSubFilter('risk', 'normal'),
        }, iconSvg('check', 'icon-xxs'), `正常 ${counts.normal}`));
      }

      const constBtns = involvedConsts.map(cid => h('button', {
        class: 'sub-filter-chip',
        'data-tone': cid,
        'aria-pressed': String(sf.constitution === cid),
        onClick: () => setZoneSubFilter('constitution', sf.constitution === cid ? 'all' : cid),
      }, h('span', { class: 'tone-dot', 'aria-hidden': 'true' }), shortName(CONST.get(cid))));

      filterBarNode = h('div', {
        class: 'sign-filter-sticky',
        'data-filtered': isSubFiltered ? 'true' : null,
      },
      h('div', { class: 'sign-filter-rail' },
        h('div', { style: 'display: inline-flex; align-items: center; gap: 6px;', role: 'radiogroup', 'aria-label': '按风险等级筛选' }, riskBtns),
        constBtns.length ? h('span', { class: 'sub-filter-sep', 'aria-hidden': 'true' }) : null,
        ...constBtns),
      isSubFiltered ? h('div', { class: 'sub-filter-status' },
        h('span', { 'aria-live': 'polite' }, `显示 ${matching.length} / ${N}`),
        h('button', {
          class: 'text-link-btn',
          onClick: () => {
            state.zoneSubFilter = { risk: 'all', constitution: 'all' };
            renderZoneDetail();
          },
        }, '重置')) : null);
    }

    const canCollapse = !desktopMQ.matches && N > 8 && !isSubFiltered;
    const visibleSigns = canCollapse && !state.zoneExpanded ? matching.slice(0, 8) : matching;
    const scopeIds = matching.map(x => x.id);

    let signsContent;
    if (!matching.length) {
      signsContent = h('div', { class: 'empty-state', style: 'min-height: 120px; padding: 16px;' },
        h('p', { class: 'empty-state-title' }, '没有符合条件的舌象'),
        h('button', {
          class: 'btn btn-ghost',
          onClick: () => {
            state.zoneSubFilter = { risk: 'all', constitution: 'all' };
            renderZoneDetail();
          },
        }, '重置'));
    } else {
      signsContent = h('div', null,
        h('div', { class: 'sign-row-grid', id: 'zone-sign-list' }, visibleSigns.map(sItem => signRowCard(sItem, scopeIds))),
        canCollapse ? h('button', {
          class: 'expand-more-btn',
          'aria-expanded': String(state.zoneExpanded),
          'aria-controls': 'zone-sign-list',
          onClick: () => {
            const prevWinY = window.scrollY;
            state.zoneExpanded = !state.zoneExpanded;
            renderZoneDetail();
            window.scrollTo({ top: prevWinY, behavior: 'auto' });
            const btn = document.querySelector('#zone-detail .expand-more-btn');
            if (btn) btn.focus({ preventScroll: true });
          },
        },
        state.zoneExpanded ? '收起列表' : `展开其余 ${N - 8} 种舌象（共 ${N} 种）`,
        iconSvg(state.zoneExpanded ? 'chevron-up' : 'chevron-down', 'icon-xs')) : null);
    }

    const zBack = originBackButton();
    fill($('zone-detail'),
      h('header', null,
        (zBack || desktopMQ.matches) ? h('div', { style: 'display: flex; align-items: center; gap: 10px; margin-bottom: 6px;' },
          zBack,
          h('p', { class: 'eyebrow only-desktop' }, '当前分区')) : null,
        h('div', { class: 'zone-head' },
          h('h2', { class: 'zone-title' }, zone.name),
          zone.organ ? h('span', { class: 'organ-pill' },
            h('span', { class: 'organ-pill-label' }, '对应脏腑'),
            h('span', { class: 'organ-pill-val' }, zone.organ)) : null)),
      h('div', { class: 'zone-divider only-desktop' }),
      zone.indicators.length ? h('section', { class: 'zone-indicators-sec' },
        sectionHeading('判读指征'),
        h('ul', { class: 'ring-bullet-list' }, zone.indicators.map(ind => h('li', { class: 'ring-bullet-item' }, richText(ind))))) : null,
      N > 0 ? h('section', { style: 'margin-top: 20px;' },
        h('div', { id: 'zone-signs-heading' }, sectionHeading(`关联舌象 · ${N}`)),
        filterBarNode,
        signsContent) : null);

    const hintEl = $('zone-scroll-hint');
    fill(hintEl, `共 ${N} 种 · 向下滚动`, iconSvg('chevron-down', 'icon-xxs'));
    requestAnimationFrame(updateZoneScrollHint);
  }

  function setZoneSubFilter(key, val) {
    state.zoneSubFilter[key] = val;
    renderZoneDetail();
    requestAnimationFrame(() => {
      if (desktopMQ.matches) {
        const scrollBox = $('zone-detail');
        const listEl = $('zone-sign-list') || scrollBox?.querySelector('.empty-state');
        const filterEl = scrollBox?.querySelector('.sign-filter-sticky');
        if (scrollBox && listEl && filterEl) {
          const targetTop = scrollBox.scrollTop + (listEl.getBoundingClientRect().top - scrollBox.getBoundingClientRect().top) - filterEl.offsetHeight - 8;
          if (scrollBox.scrollTop > targetTop) {
            scrollBox.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
          }
        }
      } else {
        const heading = $('zone-signs-heading');
        if (heading && heading.getBoundingClientRect().top < 108) {
          const y = window.scrollY + heading.getBoundingClientRect().top - 112;
          window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
        }
      }
    });
  }

  function updateZoneScrollHint() {
    const scrollEl = $('zone-detail');
    const hintEl = $('zone-scroll-hint');
    if (!scrollEl || !hintEl) return;
    const sf = scrollEl.querySelector('.sign-filter-sticky');
    if (sf) {
      const stuck = desktopMQ.matches
        ? sf.getBoundingClientRect().top <= scrollEl.getBoundingClientRect().top + 2
        : sf.getBoundingClientRect().top <= 110;
      sf.dataset.stuck = String(stuck);
    }
    if (!desktopMQ.matches) {
      hintEl.hidden = true;
      return;
    }
    const hasMore = scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 2;
    hintEl.hidden = !hasMore;
  }

  /* =========================================================
     11. TAB 3: 镜 · 照镜自查 (§6.3 & §9.3)
     ========================================================= */
  const stepIndex = id => STEPS.findIndex(st => st.id === id);
  const reachable = i => i === 0 || state.choices.has(STEPS[i - 1].id);
  const lockRuleOf = (optionId, pickedIds = new Set(state.choices.values())) => STEP_MUTEX.find(rule => rule.target === optionId && rule.when.every(id => pickedIds.has(id)));

  function remedyContrasOf(remedyId, pickedIds, isBloodStasis = false) {
    const bans = REMEDY_CONTRA
      .filter(rule => rule.target === remedyId && rule.when.every(id => pickedIds.has(id)))
      .map(rule => ({ kind: 'tongue', reason: rule.reason, pages: rule.pages }));
    if (!state.prechecks.has('pc_pregnancy_normal_stasis')) return bans;

    const rem = REMEDY.get(remedyId);
    const pregLines = rem.contraindications.filter(line => line.includes('孕妇') || line.includes('妊娠'));
    if (pregLines.length) {
      for (const line of pregLines) {
        const segPages = splitCites(line).filter(x => x.type === 'cite').flatMap(x => x.pages.match(/\d+/g) || []).map(Number);
        const inlinePages = [...line.matchAll(/p\.\s*(\d+)|第\s*(\d+)\s*页/gi)].map(m => Number(m[1] || m[2]));
        const pages = unique([...segPages, ...inlinePages]);
        bans.push({
          kind: 'pregnancy',
          reason: line,
          pages: pages.length ? pages : [119],
        });
      }
    } else if (isBloodStasis) {
      bans.push({
        kind: 'pregnancy',
        reason: '孕妇舌现瘀血指征属气血凝聚正常现象，严禁活血化瘀。',
        pages: [119],
      });
    }
    return bans;
  }

  function step4Funnel() {
    const scores = new Map();
    let seq = 0;
    for (const st of STEPS.slice(0, -1)) {
      const id = state.choices.get(st.id);
      if (!id) continue;
      OPTION.get(id).option.match_constitution_ids.forEach((cid, rank) => {
        const cur = scores.get(cid) ?? { steps: [], primaryBonus: 0, firstSeen: seq++ };
        cur.steps.push(st.step_num);
        if (rank === 0) cur.primaryBonus += 1;
        scores.set(cid, cur);
      });
    }
    const rankedCids = [...scores.entries()]
      .sort((a, b) => b[1].steps.length - a[1].steps.length
        || b[1].primaryBonus - a[1].primaryBonus
        || b[1].steps.at(-1) - a[1].steps.at(-1)
        || a[1].firstSeen - b[1].firstSeen)
      .map(([cid]) => cid);
    const topCids = new Set(rankedCids);
    const opts = STEPS.at(-1).options.map((option, index) => ({ option, index }));
    const byCid = new Map(opts.map(entry => [entry.option.match_constitution_ids[0], entry]));
    const primary = rankedCids.filter(cid => byCid.has(cid)).map(cid => ({ ...byCid.get(cid), steps: scores.get(cid).steps }));
    const secondary = opts.filter(entry => !topCids.has(entry.option.match_constitution_ids[0]));
    return { topCids, primary, secondary };
  }

  function computeWizardDerived() {
    const picked = STEPS.map(st => state.choices.get(st.id)).filter(Boolean).map(id => OPTION.get(id));
    const hits = new Map();
    const signCount = new Map();
    for (const { step, option } of picked) {
      for (const id of option.match_constitution_ids) hits.set(id, [...(hits.get(id) ?? []), step.step_num]);
      for (const id of option.match_sign_ids) signCount.set(id, (signCount.get(id) ?? 0) + 1);
    }
    const ranked = [...hits].sort((a, b) => b[1].length - a[1].length || Math.max(...b[1]) - Math.max(...a[1]));
    const signs = sortSigns([...signCount.keys()].map(id => SIGN.get(id)));
    const pickedIds = new Set(picked.map(p => p.option.id));
    const highAlerts = signs.filter(sign => sign.risk_level === 'high_alert');

    const blockedMap = new Map();
    const groups = [];
    let availableCount = 0;

    for (const [cid] of ranked) {
      const c = CONST.get(cid);
      const allowed = [];
      let blockedInGroup = 0;
      for (const rid of c.primary_remedy_ids) {
        const bans = remedyContrasOf(rid, pickedIds, cid === 'blood_stasis');
        if (bans.length) {
          blockedInGroup++;
          if (!blockedMap.has(rid)) {
            blockedMap.set(rid, { rid, cid, bans });
          }
        } else {
          allowed.push(rid);
          availableCount++;
        }
      }
      const splitCaution = allowed.includes('rem_shugan_huangqi_jianzhong')
        && ['opt_color_red_whole', 'opt_coat_yellow_greasy', 'opt_shape_red_cracks'].some(o => pickedIds.has(o));
      groups.push({ cid, allowed, blockedInGroup, splitCaution });
    }

    const blockedList = [...blockedMap.values()];
    const strongPrechecks = [...state.prechecks].filter(id => {
      if (id === 'pc_pregnancy_normal_stasis') return true;
      const link = PRECHECK_LINKS[id];
      return Boolean(link && ((link.options ?? []).some(o => pickedIds.has(o)) || (link.constitutions ?? []).some(c => hits.has(c))));
    });
    const otherPrechecks = [...state.prechecks].filter(id => !strongPrechecks.includes(id));

    return {
      picked,
      pickedIds,
      ranked,
      signs,
      highAlerts,
      blockedList,
      groups,
      availableCount,
      strongPrechecks,
      otherPrechecks,
      pregnant: state.prechecks.has('pc_pregnancy_normal_stasis'),
      isBaseline: pickedIds.has(BASELINE_OPTION.id) && !ranked.length,
    };
  }

  function renderGate() {
    const pregPc = PRECHECK.get('pc_pregnancy_normal_stasis');
    const otherPcs = KB.pre_checks.filter(p => p.id !== 'pc_pregnancy_normal_stasis');

    const buildPcCard = pc => {
      const checked = state.prechecks.has(pc.id);
      const isPreg = pc.id === 'pc_pregnancy_normal_stasis';
      const showDesc = desktopMQ.matches || state.gateOpenDesc.has(pc.id) || checked;
      return h('div', {
        class: 'pc-card',
        'data-checked': String(checked),
        'data-preg': isPreg ? 'true' : null,
      },
      h('div', { class: 'pc-top-row' },
        h('span', { class: 'pc-cat' }, pc.category),
        h('span', { class: 'caption-note' }, `P.${pc.page}`)),
      h('div', { class: 'pc-main-row' },
        h('button', {
          class: 'pc-title-btn',
          onClick: () => {
            if (!desktopMQ.matches) {
              if (state.gateOpenDesc.has(pc.id)) state.gateOpenDesc.delete(pc.id);
              else state.gateOpenDesc.add(pc.id);
              renderGate();
            } else {
              togglePrecheck(pc.id, !checked);
            }
          },
        }, pc.title),
        h('button', {
          class: 'switch-btn',
          role: 'switch',
          'aria-checked': String(checked),
          'aria-label': pc.title,
          'data-preg': isPreg ? 'true' : null,
          onClick: () => togglePrecheck(pc.id, !checked),
        }, h('span', { class: 'switch-track' }, h('span', { class: 'switch-thumb' })))),
      showDesc ? h('p', { class: 'pc-desc' }, richText(pc.description)) : null,
      checked ? h('div', { class: 'callout-r1 callout-r1-sm' },
        h('p', null, h('span', { class: 'callout-lead-warn' }, '假象风险：'), richText(pc.false_positive_risk))) : null);
    };

    fill($('gate-grid'),
      h('h3', { class: 'gate-section-label' }, '孕产安全确认'),
      h('div', { class: 'gate-cards' }, buildPcCard(pregPc)),
      h('h3', { class: 'gate-section-label' }, `观舌条件 · ${otherPcs.length} 项`),
      h('div', { class: 'gate-cards gate-cards-multi' }, otherPcs.map(buildPcCard)));
    renderGateStatus();
  }

  function renderGateStatus() {
    const count = state.prechecks.size;
    const preg = state.prechecks.has('pc_pregnancy_normal_stasis');
    const gateBtn = $('gate');
    const sealEl = $('gate-seal');
    const statusEl = $('gate-status');
    const subEl = $('gate-sub-line');
    const ctaEl = $('gate-cta');
    const pregBadge = $('gate-preg-badge');

    if (count > 0) {
      gateBtn.dataset.gateState = 'warn';
      sealEl.textContent = '查';
      statusEl.dataset.level = 'warn';
      statusEl.textContent = preg && !desktopMQ.matches ? `已勾选 ${count} 项` : `已勾选 ${count} 项干扰`;
      const checkedCats = [...state.prechecks].map(id => PRECHECK.get(id)?.category || '').filter(Boolean);
      subEl.textContent = `已记录：${checkedCats.slice(0, 3).join('、')}${checkedCats.length > 3 ? ` 等 ${count} 项` : ''} · 已同步至解读提醒`;
      ctaEl.textContent = '修改 ›';
    } else if (state.gateConfirmed) {
      gateBtn.dataset.gateState = 'ok';
      sealEl.textContent = '✓';
      statusEl.dataset.level = 'ok';
      statusEl.textContent = '已确认无干扰';
      subEl.textContent = '已排除晨起、饭后、染苔饮品、灯光偏差与孕期干扰';
      ctaEl.textContent = '重查 ›';
    } else {
      gateBtn.dataset.gateState = 'pending';
      sealEl.textContent = '查';
      statusEl.dataset.level = 'pending';
      statusEl.textContent = '待核对';
      subEl.textContent = '晨起、饭后、染苔饮品、灯光偏差与孕期会影响判读，请先核对';
      ctaEl.textContent = '先核对 ›';
    }

    pregBadge.hidden = !preg;
    if (preg) {
      fill(pregBadge, iconSvg('shield', 'icon-xxs'), '孕期保护');
    }
    $('gate-foot-count').textContent = `已勾选 ${count} / ${KB.pre_checks.length}`;
  }

  function togglePrecheck(id, on) {
    state.gateConfirmed = true;
    if (on) state.prechecks.add(id);
    else state.prechecks.delete(id);
    renderGate();
    renderReadout();
    renderWizardDock();
    if (sheetDialog.open && state.sheetCtx?.type === 'wizard-readout') {
      renderActiveSheet();
    }
  }

  function chooseOption(stepId, optionId, advanceStep = false) {
    if (lockRuleOf(optionId)) return;
    const curStepIdx = stepIndex(stepId);
    const { option } = OPTION.get(optionId);
    const prev = state.choices.get(stepId);
    if (prev && OPTION.get(prev).option.next_step_id !== option.next_step_id) {
      for (const st of STEPS.slice(curStepIdx + 1)) state.choices.delete(st.id);
    }
    state.choices.set(stepId, optionId);
    if (state.mutexNotice?.targetStepId === stepId) {
      state.mutexNotice = null;
    }

    for (let k = curStepIdx + 1; k < STEPS.length; k += 1) {
      const downId = state.choices.get(STEPS[k].id);
      if (downId) {
        if (!reachable(k)) {
          state.choices.delete(STEPS[k].id);
        } else if (lockRuleOf(downId)) {
          state.choices.delete(STEPS[k].id);
          state.mutexNotice = { fromStep: curStepIdx + 1, targetStepId: STEPS[k].id };
        }
      }
    }

    const lastId = STEPS.at(-1).id;
    if (stepId !== lastId && state.choices.get(lastId) === BASELINE_OPTION.id && step4Funnel().primary.length > 0) {
      state.choices.delete(lastId);
    }
    if (advanceStep && option.next_step_id) {
      state.step = option.next_step_id;
    }
    state.roSignsExpanded = false;
    renderWizard();
  }

  function goStep(stepId) {
    const idx = stepIndex(stepId);
    if (idx === -1 || !reachable(idx)) return;
    state.step = stepId;
    renderWizard();
    if (!desktopMQ.matches) {
      const wrap = $('wz-stepper-wrap');
      if (wrap && wrap.getBoundingClientRect().top <= 58) {
        const stepEl = $('wizard-step');
        const y = window.scrollY + stepEl.getBoundingClientRect().top - 116;
        window.scrollTo({ top: Math.max(0, y), behavior: scrollMode() });
      }
    } else {
      $('wizard-step').scrollTop = 0;
    }
  }

  function resetWizard() {
    state.choices.clear();
    state.step = STEPS[0].id;
    state.mutexNotice = null;
    state.roSignsExpanded = false;
    state.expandedContraIds.clear();
    renderWizard();
  }

  function renderWizard() {
    renderPath();
    renderRail();
    renderStep();
    renderReadout();
    renderWizardDock();
  }

  function renderPath() {
    const current = stepIndex(state.step);
    fill($('wizard-path'), ...STEPS.map((st, i) => {
      const chosen = state.choices.get(st.id);
      const info = chosen && OPTION.get(chosen);
      const open = reachable(i);
      const letter = info && (info.index < 0 ? '安' : LETTERS[info.index]);
      const choiceText = desktopMQ.matches
        ? (info ? `${letter} · ${info.option.label}` : open ? '待选择' : '未解锁')
        : (info ? `已选 ${letter}` : open ? '待选择' : '未解锁');
      return h('li', { class: 'step-tab-item' },
        h('button', {
          class: 'path-step',
          role: 'tab',
          'aria-selected': String(i === current),
          'aria-current': i === current ? 'step' : null,
          'data-done': String(Boolean(info)),
          disabled: !open,
          'aria-disabled': !open ? 'true' : null,
          title: info ? `${letter} · ${info.option.label}` : st.title,
          onClick: () => goStep(st.id),
        },
        h('span', { class: 'path-no' }, CN[i + 1]),
        h('span', { class: 'path-text' },
          h('span', { class: 'path-title' }, desktopMQ.matches ? `第${CN[i + 1]}步 · ${stepShort(st)}` : stepShort(st)),
          h('span', { class: 'path-choice' }, choiceText))));
    }));
  }

  function renderRail() {
    const colX = i => 45 + i * 90;
    const nodeY = (count, j) => {
      const span = Math.min(30 * (count - 1), 180);
      return count > 1 ? 166 - span / 2 + (j * span) / (count - 1) : 166;
    };
    const current = stepIndex(state.step);
    const { topCids } = step4Funnel();
    const pickedIds = new Set(state.choices.values());
    const edges = [];
    const cols = STEPS.map((st, i) => {
      const chosen = state.choices.get(st.id);
      const open = reachable(i);
      const x = colX(i);
      if (i < STEPS.length - 1 && chosen && OPTION.get(chosen).index >= 0) {
        const fromY = nodeY(st.options.length, OPTION.get(chosen).index);
        const next = STEPS[i + 1];
        const nextChosen = state.choices.get(next.id);
        const x1 = x + 13;
        const x2 = colX(i + 1) - 13;
        const mid = (x1 + x2) / 2;
        next.options.forEach((o, j) => {
          const toY = nodeY(next.options.length, j);
          edges.push(s('path', {
            class: 'rail-edge',
            'data-on': String(o.id === nextChosen),
            'data-locked': lockRuleOf(o.id, pickedIds) ? 'true' : null,
            d: `M${x1} ${fromY}C${mid} ${fromY} ${mid} ${toY} ${x2} ${toY}`,
          }));
        });
      }
      return s('g', {
        class: 'rail-col',
        'data-current': String(i === current),
        'data-open': String(open),
        'data-done': String(Boolean(chosen)),
      },
      s('g', {
        class: 'rail-head',
        'data-step': st.id,
        role: 'button',
        tabindex: open ? 0 : -1,
        'aria-label': st.title,
      },
      s('circle', { class: 'rail-head-dot', cx: x, cy: 26, r: 12 }),
      s('text', { class: 'rail-head-no', x, y: 30 }, CN[i + 1]),
      s('text', { class: 'rail-head-title', x, y: 56 }, stepShort(st))),
      st.options.map((o, j) => {
        const y = nodeY(st.options.length, j);
        const inFunnel = i < STEPS.length - 1 || topCids.has(o.match_constitution_ids[0]);
        const lock = lockRuleOf(o.id, pickedIds);
        const locked = !open || Boolean(lock);
        const nodeState = locked ? 'locked' : o.id === chosen ? 'chosen' : i === current && inFunnel ? 'open' : 'dim';
        return s('g', {
          class: 'rail-node',
          'data-state': nodeState,
          'data-step': st.id,
          'data-option': o.id,
          role: 'button',
          tabindex: locked ? -1 : 0,
          'aria-disabled': locked ? 'true' : null,
          'aria-label': `${st.title} ${LETTERS[j]}：${plainText(o.label)}`,
        },
        s('title', null, `${LETTERS[j]} · ${plainText(o.label)}`, lock ? ` · 互斥锁定：${lock.reason}` : null),
        s('circle', { class: 'rail-dot', cx: x, cy: y, r: 12 }),
        s('text', { class: 'rail-letter', x, y: y + 4 }, LETTERS[j]));
      }));
    });
    const lanes = STEPS.map((_, i) => s('rect', {
      class: 'rail-lane',
      'data-current': String(i === current),
      x: colX(i) - 38,
      y: 6,
      width: 76,
      height: 266,
      rx: 14,
    }));
    fill($('wizard-rail'), s('svg', {
      class: 'rail-svg',
      viewBox: '0 0 360 278',
      role: 'group',
      'aria-label': '四步分路轨迹图',
    }, s('g', null, lanes), s('g', null, edges), cols));
  }

  function buildOptionCard(st, stepIdx, option, j, on, { lockRule = null, priorityBadge = null, figPool = [] } = {}) {
    const isLocked = Boolean(lockRule);
    const isBaseline = j < 0;
    const letter = isBaseline ? '安' : LETTERS[j];
    const isHighRisk = stepIdx < 3 && option.match_sign_ids.some(sid => SIGN.get(sid)?.risk_level === 'high_alert');
    const hasFig = Boolean(option.fig_id && !state.failedFigs.has(option.fig_id));

    const metaLeft = [
      h('span', { class: 'opt-letter', 'data-baseline': isBaseline ? 'true' : null }, letter),
    ];
    if (on && !isLocked) {
      metaLeft.push(h('span', { class: 'opt-state-badge opt-state-chosen' }, iconSvg('check', 'icon-xxs'), '已选'));
    }
    if (priorityBadge && !isLocked) {
      metaLeft.push(h('span', { class: 'opt-state-badge opt-state-priority' }, iconSvg('arrow-up', 'icon-xxs'), priorityBadge));
    }
    if (isLocked) {
      metaLeft.push(h('span', { class: 'opt-state-badge opt-state-locked' }, iconSvg('lock', 'icon-xxs'), '互斥锁定 · 不可选'));
    } else if (isHighRisk) {
      metaLeft.push(h('span', { class: 'opt-state-badge opt-state-danger' }, iconSvg('triangle', 'icon-xxs'), '高危预警'));
    }

    const thumbNode = hasFig
      ? h('button', {
        class: 'opt-thumb-btn',
        'aria-label': `查看大图：${plainText(option.label)}`,
        onClick: e => {
          e.stopPropagation();
          openLightbox(figPool, figPool.findIndex(it => it.optionId === option.id), e.currentTarget);
        },
      }, figImg(option.fig_id, { alt: option.label }))
      : h('span', { class: 'opt-thumb-slot' },
        h('span', { class: 'nofig-box' }, iconSvg('doc', 'icon-xs'), '原书无配图'));

    const sourceStepNum = lockRule ? (OPTION.get(lockRule.when[0])?.step.step_num ?? 1) : 1;
    const lockCallout = isLocked ? h('div', { class: 'callout-r2 callout-r2-sm' },
      h('p', { class: 'callout-r2-text' },
        h('span', { class: 'callout-lead-danger' }, '互斥锁定：'),
        lockRule.reason),
      h('div', { class: 'callout-r2-foot' },
        pageLinksLine(lockRule.pages, true),
        h('button', {
          class: 'text-link-btn',
          onClick: e => {
            e.stopPropagation();
            goStep(STEPS[sourceStepNum - 1].id);
          },
        }, `改选第${CN[sourceStepNum]}步 ›`))) : null;

    const card = h('div', {
      class: 'opt-card',
      role: 'radio',
      tabindex: isLocked ? '-1' : '0',
      'aria-checked': String(Boolean(on && !isLocked)),
      'aria-pressed': String(Boolean(on && !isLocked)),
      'aria-disabled': isLocked ? 'true' : null,
      'data-option-id': option.id,
      'data-selected': on && !isLocked ? 'true' : null,
      'data-priority': priorityBadge ? 'true' : null,
      'data-high-risk': isHighRisk ? 'true' : null,
      'data-locked': isLocked ? 'true' : null,
      onClick: e => {
        if (isLocked || e.target.closest('.cite-ref, button, a')) return;
        chooseOption(st.id, option.id, false);
      },
      onKeydown: e => {
        if (isLocked || e.target !== card || !isActivationKey(e)) return;
        e.preventDefault();
        chooseOption(st.id, option.id, false);
      },
    },
    h('div', { class: 'opt-meta-row' },
      h('div', { class: 'opt-meta-left' }, metaLeft),
      option.match_constitution_ids.length ? h('div', { class: 'opt-meta-right' }, option.match_constitution_ids.map(toneTag)) : null),
    h('div', { class: 'opt-body-grid' },
      thumbNode,
      h('div', { class: 'opt-text-col' },
        h('span', { class: 'opt-label' }, option.label),
        !isLocked ? h('span', { class: 'opt-hint' }, on ? richText(option.hint) : plainText(option.hint)) : null)),
    lockCallout);

    return card;
  }

  function renderStep() {
    const st = STEP.get(state.step);
    const i = stepIndex(st.id);
    const chosen = state.choices.get(st.id);
    const isLast = i === STEPS.length - 1;
    const nextStepId = chosen ? OPTION.get(chosen).option.next_step_id : (STEPS[i + 1]?.id ?? null);

    let optionEntries = [];
    let noticeNode = null;

    if (!isLast) {
      optionEntries = st.options.map((o, j) => ({
        option: o,
        j,
        lockRule: lockRuleOf(o.id),
        priorityBadge: null,
      }));
    } else {
      const { primary, secondary } = step4Funnel();
      const fullNote = primary.length
        ? `已按前 3 步舌象置顶高亮 ${primary.length} 项高相关体征，优先核对即可锁定主导体质；其余 ${secondary.length} 项同屏保留、可直接点选（防厚苔掩盖真象）。`
        : '前 3 步均为正常健康舌象：若日常无明显不适，直接确认首张「基本健康基线」即可完成自查；仍有身体不适，可在其后七大体质体征中逐项排查。';
      const compactNote = primary.length
        ? `已置顶 ${primary.length} 项高相关体征 · 其余 ${secondary.length} 项同屏可选`
        : '前三步均为健康舌象 · 首张为基本健康基线';
      const showFull = desktopMQ.matches || state.priorityNoticeExpanded;
      noticeNode = h('div', { class: 'priority-notice' },
        h('span', { class: 'priority-notice-main' },
          iconSvg('arrow-up', 'icon-xs'),
          h('span', null, showFull ? fullNote : compactNote)),
        !desktopMQ.matches ? h('button', {
          class: 'text-link-btn',
          onClick: () => {
            const prevWinY = window.scrollY;
            state.priorityNoticeExpanded = !state.priorityNoticeExpanded;
            renderStep();
            window.scrollTo({ top: prevWinY, behavior: 'auto' });
          },
        }, state.priorityNoticeExpanded ? '收起' : '说明') : null);

      if (primary.length) {
        optionEntries = [
          ...primary.map(({ option, index, steps }) => ({
            option,
            j: index,
            lockRule: null,
            priorityBadge: `优先追问 · 舌象命中 ${steps.map(n => `步${CN[n]}`).join('·')}`,
          })),
          ...secondary.map(({ option, index }) => ({
            option,
            j: index,
            lockRule: null,
            priorityBadge: null,
          })),
        ];
      } else {
        optionEntries = [
          { option: BASELINE_OPTION, j: -1, lockRule: null, priorityBadge: '优先确认 · 前三步舌象正常' },
          ...secondary.map(({ option, index }) => ({ option, j: index, lockRule: null, priorityBadge: null })),
        ];
      }
    }

    const figPool = optionEntries
      .filter(e => e.option.fig_id)
      .map(e => ({
        figId: e.option.fig_id,
        caption: `${e.j < 0 ? '安' : LETTERS[e.j]} · ${e.option.label}`,
        optionId: e.option.id,
        stepId: st.id,
        locked: Boolean(e.lockRule),
      }));

    const mutexClearedBar = state.mutexNotice?.targetStepId === st.id ? h('div', { class: 'callout-r1 callout-r1-sm', style: 'margin-bottom: 8px;' },
      h('p', null,
        h('span', { class: 'callout-lead-warn' }, '提示：'),
        `第${CN[state.mutexNotice.fromStep]}步改选后，本步原选项与之互斥，请重新选择。`)) : null;

    fill($('wizard-step'),
      h('header', { class: 'step-head' },
        h('div', { class: 'step-head-top' },
          h('p', { class: 'eyebrow' }, `第 ${i + 1} / ${STEPS.length} 步 · ${stepShort(st)}`),
          !desktopMQ.matches ? h('button', {
            class: 'text-link-btn',
            onClick: e => openRailModal(e.currentTarget),
          }, '轨迹全图') : h('div', { class: 'panel-nav-btns' },
            h('button', {
              class: 'btn-ghost-sm',
              disabled: i === 0,
              onClick: () => goStep(STEPS[i - 1].id),
            }, '‹ 上一步'),
            h('button', {
              class: 'text-link-btn',
              onClick: resetWizard,
            }, '重新开始'),
            isLast && chosen
              ? h('span', { class: 'rel-tag' }, `已完成 ${STEPS.length} / ${STEPS.length} 步`)
              : h('button', {
                class: 'btn btn-primary',
                style: 'min-height: 36px; padding-inline: 12px;',
                disabled: !chosen || isLast,
                onClick: () => {
                  if (nextStepId) goStep(nextStepId);
                },
              }, '下一步 →'))),
        h('h2', { class: 'step-title' }, stripStepPrefix(st.title)),
        h('p', { class: 'step-prompt' }, richText(st.prompt))),
      mutexClearedBar,
      noticeNode,
      h('div', { class: 'opt-grid', role: 'radiogroup', 'aria-label': stripStepPrefix(st.title) },
        optionEntries.map(entry => buildOptionCard(st, i, entry.option, entry.j, entry.option.id === chosen, {
          lockRule: entry.lockRule,
          priorityBadge: entry.priorityBadge,
          figPool,
        }))),
      h('footer', { class: 'step-foot-mobile' },
        h('button', {
          class: 'btn btn-ghost',
          disabled: i === 0,
          onClick: () => goStep(STEPS[i - 1].id),
        }, '‹ 上一步'),
        h('button', {
          class: 'text-link-btn',
          onClick: resetWizard,
        }, '重新开始')));
  }

  function renderWizardDock() {
    const d = computeWizardDerived();
    const curIdx = stepIndex(state.step);
    const chosen = state.choices.get(state.step);
    const isLast = curIdx === STEPS.length - 1;
    const nextStepId = chosen ? OPTION.get(chosen).option.next_step_id : (STEPS[curIdx + 1]?.id ?? null);

    let sealNode;
    let line1Nodes;
    if (d.isBaseline) {
      sealNode = h('span', { class: 'dock-seal-ok' }, '安');
      line1Nodes = [h('span', { class: 'dock-title' }, '基本健康基线')];
    } else if (d.ranked.length) {
      const [topCid] = d.ranked[0];
      sealNode = constSeal(topCid, 'sm');
      line1Nodes = [
        h('span', { class: 'dock-title' }, CONST.get(topCid).name),
        d.ranked.length > 1 ? h('span', { class: 'dock-plus' }, `+${d.ranked.length - 1}`) : null,
      ];
    } else {
      sealNode = h('span', { class: 'dock-seal-empty' }, '—');
      line1Nodes = [h('span', { class: 'dock-title' }, '暂无命中体质')];
    }

    const badgeCandidates = [];
    if (d.highAlerts.length) {
      badgeCandidates.push(h('span', { class: 'dock-badge dock-badge-redline' }, iconSvg('triangle', 'icon-xxs'), `红线 ${d.highAlerts.length}`));
    }
    if (d.pregnant) {
      badgeCandidates.push(h('span', { class: 'dock-badge dock-badge-preg' }, '孕'));
    }
    if (d.blockedList.length) {
      badgeCandidates.push(h('span', { class: 'dock-badge dock-badge-contra' }, iconSvg('ban', 'icon-xxs'), `禁忌 ${d.blockedList.length}`));
    }
    if (state.prechecks.size) {
      badgeCandidates.push(h('span', { class: 'dock-badge dock-badge-warn' }, `留意 ${state.prechecks.size}`));
    }

    fill($('wizard-dock'),
      h('button', {
        class: 'dock-capsule',
        'aria-haspopup': 'dialog',
        onClick: e => openSheet({ type: 'wizard-readout' }, e.currentTarget),
      },
      sealNode,
      h('span', { class: 'dock-text' },
        h('span', { class: 'dock-line1' }, line1Nodes),
        h('span', { class: 'dock-line2' }, `已完成 ${d.picked.length} / ${STEPS.length} 步`)),
      badgeCandidates.length ? h('span', { class: 'dock-badges' }, badgeCandidates.slice(0, 2)) : null,
      iconSvg('chevron-up', 'icon-sm')),
      h('button', {
        class: 'btn btn-primary dock-next-btn',
        disabled: !chosen,
        'aria-disabled': !chosen ? 'true' : null,
        onClick: e => {
          if (!chosen) return;
          if (isLast || !nextStepId) openSheet({ type: 'wizard-readout' }, e.currentTarget);
          else goStep(nextStepId);
        },
      }, isLast || (chosen && !nextStepId) ? '查看解读' : '下一步 ›'));
  }

  function buildReadoutParts(inSheet = false) {
    const d = computeWizardDerived();
    const k = d.highAlerts.length;
    const b = d.blockedList.length;
    const kbTotal = k + b;
    const g = state.prechecks.size;
    const pfx = inSheet ? 'sheet-ro-' : 'desk-ro-';

    const scrollToSec = secId => {
      const container = inSheet ? $('sheet-body') : $('wizard-readout').querySelector('.ro-scroll-body');
      const target = document.getElementById(secId);
      if (container && target) {
        target.scrollIntoView({ behavior: scrollMode(), block: 'start' });
      }
    };

    const anchorDefs = [
      { id: `${pfx}const`, label: `体质 ${d.ranked.length}`, danger: false },
      { id: `${pfx}redline`, label: `禁忌与红线 ${kbTotal}`, danger: kbTotal > 0, shield: kbTotal > 0 },
      { id: `${pfx}remedy`, label: `调理 ${d.availableCount}`, danger: false },
      { id: `${pfx}rules`, label: '拆解顺序', danger: false },
      { id: `${pfx}signs`, label: `舌象 ${d.signs.length}`, danger: false },
    ];
    const anchors = anchorDefs.map((a, idx) => h('button', {
      class: 'ro-anchor-chip',
      'data-danger': a.danger ? 'true' : null,
      'data-current': idx === 0 ? 'true' : null,
      onClick: e => {
        const parent = e.currentTarget.parentElement;
        for (const sib of parent.querySelectorAll('.ro-anchor-chip')) sib.removeAttribute('data-current');
        e.currentTarget.dataset.current = 'true';
        scrollToSec(a.id);
      },
    }, a.shield ? iconSvg('shield', 'icon-xxs') : null, a.label));

    const pathSummary = STEPS.map((st, i) => {
      const cid = state.choices.get(st.id);
      if (!cid) return `${CN[i + 1]} —`;
      const idx = OPTION.get(cid).index;
      return `${CN[i + 1]} ${idx < 0 ? '安' : LETTERS[idx]}`;
    }).join(' → ');

    const secProgress = h('div', { style: 'display: flex; flex-direction: column; gap: 8px;' },
      h('div', { class: 'ro-seg-meter' }, STEPS.map(st => h('span', { class: 'ro-seg-bar', 'data-on': String(state.choices.has(st.id)) }))),
      h('div', { class: 'ro-summary-line' },
        h('span', null, `分路：${pathSummary}`),
        inSheet ? h('button', {
          class: 'text-link-btn',
          onClick: () => sheetDialog.close(),
        }, '改选') : null));

    const emptyNotice = !d.picked.length ? h('p', { class: 'caption-note' }, '从第一步开始选择，体质匹配、禁忌红线、调理入口与原书舌象会随每一步实时更新。') : null;

    const gateNudge = (d.picked.length > 0 && g === 0 && !state.gateConfirmed) ? h('div', { class: 'gate-nudge-bar' },
      h('span', null, '尚未核对「观舌前 12 项」（染苔、晨起、孕期等）'),
      h('button', {
        class: 'text-link-btn',
        onClick: () => {
          if (inSheet) sheetDialog.close();
          openGateModal($('gate'));
        },
      }, '去核对 ›')) : null;

    const baselineCard = d.isBaseline ? h('div', { class: 'embed-secondary' },
      h('span', { class: 'embed-secondary-label' }, '基本健康基线 · 未见明显偏颇体质'),
      h('p', { class: 'embed-secondary-body' }, richText(BASELINE_OPTION.hint))) : null;

    const secConst = d.ranked.length ? h('section', { id: `${pfx}const` },
      sectionHeading(`匹配体质 · ${d.ranked.length}`),
      h('div', { class: 'hit-const-list' }, d.ranked.map(([cid, steps], idx) => h('button', {
        class: 'hit-const-row',
        'data-tone': cid,
        onClick: () => jumpToConstitution(cid, true),
      },
      constSeal(cid, 'sm'),
      h('span', { class: 'hit-const-name' }, CONST.get(cid).name),
      idx === 0 ? h('span', { class: 'rel-tag' }, '首选') : null,
      h('span', { class: 'hit-const-bar' }, h('span', { class: 'hit-const-fill', style: `--p: ${steps.length / STEPS.length}` })),
      h('span', { class: 'caption-note' }, steps.map(n => `步${CN[n]}`).join(' ')))))) : null;

    /* Section B: 禁忌与红线 · {k+b} + R1 观舌条件提醒 (§3.5 & §9.3) */
    let precheckCallout = null;
    if (g > 0) {
      let pcContent;
      if (g <= 2 || state.gateReadoutExpanded) {
        const allChecked = [...d.strongPrechecks, ...d.otherPrechecks];
        pcContent = h('div', { style: 'display: flex; flex-direction: column; gap: 4px;' },
          h('p', null, '你勾选了以下情况，此刻看到的舌象可能有假象，建议排除后再对照：'),
          h('ul', { class: 'ring-bullet-list' }, allChecked.map(id => {
            const pc = PRECHECK.get(id);
            const isStrong = d.strongPrechecks.includes(id);
            return h('li', { class: 'ring-bullet-item' },
              h('strong', null, pc.title),
              isStrong ? h('span', null, ' — ', richText(pc.false_positive_risk)) : null);
          })),
          g > 2 ? h('button', {
            class: 'text-link-btn',
            onClick: () => {
              state.gateReadoutExpanded = false;
              renderReadout({ preserveScroll: true });
              if (inSheet) renderActiveSheet({ preserveScroll: true });
            },
          }, '收起') : null);
      } else {
        pcContent = h('div', { style: 'display: flex; flex-direction: column; gap: 4px;' },
          d.strongPrechecks.map(id => {
            const pc = PRECHECK.get(id);
            return h('p', null, h('strong', null, `${pc.title}：`), richText(pc.false_positive_risk));
          }),
          d.otherPrechecks.length ? h('div', { style: 'display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;' },
            h('span', null, `另有 ${d.otherPrechecks.length} 项观舌干扰，此刻舌象可能有假象`),
            h('button', {
              class: 'text-link-btn',
              onClick: () => {
                state.gateReadoutExpanded = true;
                renderReadout({ preserveScroll: true });
                if (inSheet) renderActiveSheet({ preserveScroll: true });
              },
            }, `展开全部 ${g} 项`)) : null);
      }
      precheckCallout = h('div', { class: 'callout-r1' },
        h('span', { class: 'callout-r1-label' }, `观舌条件提醒 · ${g} 项`),
        pcContent);
    }

    const r3Block = k > 0 ? h('div', { class: 'callout-r3' },
      h('div', { class: 'callout-r3-head' },
        iconSvg('triangle', 'icon-sm'),
        `红线 · 命中高危预警舌象 ${k}`),
      h('p', { class: 'callout-r3-body' }, '请先阅读这些舌象的处置原则；舌诊只给怀疑的权利，须尽快请执业医师确诊。'),
      h('div', { class: 'callout-r3-divider' }),
      ...d.highAlerts.map(sign => h('button', {
        class: 'callout-r3-link',
        onClick: () => openSign(sign.id, d.signs.map(x => x.id)),
      }, `› ${sign.title} · P.${sign.page}`))) : null;

    const r2Cards = d.blockedList.map(({ rid, cid, bans }) => {
      const kinds = new Set(bans.map(x => x.kind));
      const tagLabel = kinds.size > 1 ? '舌象/孕期禁忌 · 已屏蔽' : kinds.has('pregnancy') ? '孕期禁忌 · 已屏蔽' : '舌象禁忌 · 已屏蔽';
      const allPages = unique(bans.flatMap(x => x.pages));
      const isExpanded = state.expandedContraIds.has(rid);
      const rem = REMEDY.get(rid);
      const combinedPlain = bans.map(x => plainText(x.reason)).join('；');

      return h('div', {
        class: 'callout-r2',
        'data-contra-remedy': rid,
      },
      h('div', { class: 'callout-r2-head' },
        h('span', { class: 'callout-r2-tag' }, iconSvg('ban', 'icon-sm'), tagLabel),
        toneTag(cid)),
      h('p', { class: 'callout-r2-name' }, rem.name),
      isExpanded
        ? h('div', { style: 'display: flex; flex-direction: column; gap: 6px;' },
          bans.map(ban => h('p', { class: 'callout-r2-text' },
            kinds.size > 1 ? h('strong', null, `${ban.kind === 'pregnancy' ? '孕期' : '舌象'}：`) : null,
            richText(ban.reason))))
        : h('p', { class: 'callout-r2-text-clamped' }, combinedPlain),
      h('div', { class: 'callout-r2-foot' },
        pageLinksLine(allPages, true),
        h('button', {
          class: 'text-link-btn',
          onClick: () => {
            if (isExpanded) state.expandedContraIds.delete(rid);
            else state.expandedContraIds.add(rid);
            renderReadout({ preserveScroll: true });
            if (inSheet) renderActiveSheet({ preserveScroll: true });
          },
        }, isExpanded ? '收起' : '展开')));
    });

    const secRedline = (kbTotal > 0 || precheckCallout) ? h('section', { id: `${pfx}redline`, style: 'display: flex; flex-direction: column; gap: 8px;' },
      kbTotal > 0 ? h('div', { style: 'display: flex; align-items: baseline; justify-content: space-between; gap: 8px;' },
        h('h3', { class: 'section-heading', style: 'color: var(--danger);' },
          iconSvg('shield', 'icon-sm'),
          `禁忌与红线 · ${kbTotal}`),
        h('span', { class: 'caption-note' }, `红线 ${k} · 已屏蔽 ${b}`)) : null,
      r3Block,
      ...r2Cards,
      precheckCallout) : null;

    /* Section C: 匹配调理方法 · {r} */
    const secRemedies = d.groups.length ? h('section', { id: `${pfx}remedy` },
      sectionHeading(`匹配调理方法 · ${d.availableCount}`),
      d.groups.map(({ cid, allowed, blockedInGroup, splitCaution }) => h('div', { class: 'ro-rem-group' },
        h('div', null, toneTag(cid)),
        ...allowed.map(rid => {
          const r = REMEDY.get(rid);
          const row = h('button', {
            class: 'ro-rem-row',
            onClick: () => jumpToRemedy(rid, true),
          },
          methodSeal(r.method_type, 'md'),
          h('span', { class: 'ro-rem-name' }, r.name),
          iconSvg('chevron-right', 'icon-sm row-chevron'));
          if (rid === 'rem_shugan_huangqi_jianzhong' && splitCaution) {
            return [
              row,
              h('div', {
                class: 'callout-r1 callout-r1-sm',
                'data-caution-remedy': 'rem_shugan_huangqi_jianzhong',
              },
              h('p', null,
                h('span', { class: 'callout-lead-warn' }, '拆分用药提醒：'),
                '肝郁胃痛可按说明用舒肝和胃丸；方中黄芪建中汤（含桂枝、生姜、饴糖）偏温补，仅适用于舌质淡白、身体怕凉的脾胃虚寒证，当前舌红或黄厚腻热象忌盲目自服黄芪建中汤。'),
              h('div', { style: 'font-size: 12px;' }, pageLinksLine([180, 181], true))),
            ];
          }
          return row;
        }),
        blockedInGroup > 0 ? h('button', {
          class: 'text-link-btn',
          style: 'justify-content: flex-start;',
          onClick: () => scrollToSec(`${pfx}redline`),
        }, `另有 ${blockedInGroup} 项因禁忌已屏蔽，见「禁忌与红线」`) : null))) : null;

    /* Section D: 复合体质拆解先后顺序 */
    const rules = KB.decision_tree.compound_priority_rules;
    const secRules = h('section', { id: `${pfx}rules` },
      sectionHeading('复合体质拆解先后顺序'),
      d.ranked.length > 1 ? h('p', { class: 'caption-note', style: 'margin-top: 4px;' }, `命中 ${d.ranked.length} 种体质，按书中顺序逐层拆解：`) : null,
      h('div', { class: 'rules-list' }, rules.map((rule, idx) => {
        if (inSheet && !tabletUpMQ.matches) {
          return h('details', { class: 'rule-item', open: idx === 0 },
            h('summary', { class: 'rule-summary' },
              h('span', { class: 'rule-no' }, String(rule.order)),
              h('span', { class: 'rule-title' }, rule.title),
              iconSvg('chevron-down', 'icon-xs')),
            h('div', { class: 'rule-body' },
              h('p', null, richText(rule.rule)),
              h('div', { style: 'margin-top: 4px;' }, pageLink(rule.page, true))));
        }
        return h('div', { class: 'rule-item' },
          h('div', { class: 'rule-summary', style: 'cursor: default;' },
            h('span', { class: 'rule-no' }, String(rule.order)),
            h('span', { class: 'rule-title' }, rule.title)),
          h('div', { class: 'rule-body' },
            h('p', null, richText(rule.rule)),
            h('div', { style: 'margin-top: 4px;' }, pageLink(rule.page, true))));
      })));

    /* Section E: 匹配原书舌象 · {t} */
    let secSigns = null;
    if (d.signs.length) {
      const signScope = d.signs.map(x => x.id);
      if (inSheet && !tabletUpMQ.matches) {
        secSigns = h('section', { id: `${pfx}signs` },
          sectionHeading(`匹配原书舌象 · ${d.signs.length}`),
          h('div', { class: 'ro-sign-rail' }, d.signs.map(sItem => {
            const hasFig = Boolean(sItem.fig_id && !state.failedFigs.has(sItem.fig_id));
            return h('button', {
              class: 'ro-sign-mini-card',
              'data-risk': sItem.risk_level,
              onClick: () => openSign(sItem.id, signScope),
            },
            hasFig
              ? h('span', { class: 'ro-sign-mini-stage img-stage' }, figImg(sItem.fig_id, { alt: sItem.title }))
              : noFigBoard(sItem.visual_features),
            h('span', { class: 'ro-sign-mini-title' }, sItem.title),
            h('span', { class: 'sign-row-meta-left' }, riskBadge(sItem.risk_level, 'sm'), h('span', { class: 'caption-note' }, `P.${sItem.page}`)));
          })));
      } else {
        const canCollapse = d.signs.length > 6;
        const visSigns = canCollapse && !state.roSignsExpanded ? d.signs.slice(0, 6) : d.signs;
        const listId = `${pfx}signs-grid`;
        secSigns = h('section', { id: `${pfx}signs` },
          sectionHeading(`匹配原书舌象 · ${d.signs.length}`),
          h('div', { class: 'sign-row-grid', id: listId, style: 'grid-template-columns: minmax(0, 1fr);' },
            visSigns.map(sItem => signRowCard(sItem, signScope))),
          canCollapse ? h('button', {
            class: 'expand-more-btn',
            'aria-expanded': String(state.roSignsExpanded),
            'aria-controls': listId,
            onClick: () => {
              state.roSignsExpanded = !state.roSignsExpanded;
              renderReadout({ preserveScroll: true });
              if (inSheet) renderActiveSheet({ preserveScroll: true });
              requestAnimationFrame(() => {
                const scope = inSheet ? $('sheet-body') : $('wizard-readout');
                const btn = scope?.querySelector('.expand-more-btn');
                if (btn) btn.focus({ preventScroll: true });
              });
            },
          },
          state.roSignsExpanded ? '收起列表' : `展开其余 ${d.signs.length - 6} 种舌象（共 ${d.signs.length} 种）`,
          iconSvg(state.roSignsExpanded ? 'chevron-up' : 'chevron-down', 'icon-xs')) : null);
      }
    }

    const disclaimer = h('p', { class: 'ro-disclaimer' }, richText(KB.meta.medical_disclaimer.statement));

    return {
      pickedCount: d.picked.length,
      anchors,
      sections: [secProgress, emptyNotice, gateNudge, baselineCard, secConst, secRedline, secRemedies, secRules, secSigns, disclaimer],
    };
  }

  function renderReadout({ preserveScroll = false } = {}) {
    const prevScroll = preserveScroll ? ($('wizard-readout')?.querySelector('.ro-scroll-body')?.scrollTop ?? 0) : 0;
    const ro = buildReadoutParts(false);
    fill($('wizard-readout'),
      h('div', { class: 'ro-sticky-top' },
        h('div', { class: 'ro-title-row' },
          h('h2', { class: 'ro-heading' }, '实时分路解读'),
          h('span', { class: 'caption-note' }, `已完成 ${ro.pickedCount} / ${STEPS.length} 步`)),
        h('div', { class: 'ro-anchors' }, ro.anchors)),
      h('div', { class: 'ro-scroll-body' }, ro.sections));
    if (preserveScroll) {
      const sb = $('wizard-readout')?.querySelector('.ro-scroll-body');
      if (sb) sb.scrollTop = prevScroll;
    }
  }

  function openGateModal(triggerEl) {
    closeCitePopover(false);
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(gateDialog, triggerEl);
    $('gate').setAttribute('aria-expanded', 'true');
    if (!gateDialog.open) {
      gateDialog.showModal();
      pushModalHistory('gate');
    }
  }

  function openRailModal(triggerEl) {
    closeCitePopover(false);
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(railDialog, triggerEl);
    if (!railDialog.open) {
      railDialog.showModal();
      pushModalHistory('rail');
    }
  }

  /* =========================================================
     12. TAB 4: 鉴 · 图鉴对比 (§6.4 & §9.4)
     ========================================================= */
  function getAtlasTagOptions() {
    const tagCounts = new Map();
    for (const tag of KB.tongue_signs.flatMap(sign => sign.alert_tags)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    return [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
  }

  function getFilteredAtlasSigns() {
    const f = state.atlas;
    return KB.tongue_signs.filter(sign => (f.risk === 'all' || sign.risk_level === f.risk)
      && (f.constitution === 'all' || sign.constitution_ids.includes(f.constitution))
      && (f.zone === 'all' || sign.zone_ids.includes(f.zone))
      && (f.tag === 'all' || sign.alert_tags.includes(f.tag)));
  }

  function buildFilterDropdown(popId, key, defaultLabel, options, withTone = false) {
    const pop = h('div', { id: popId, class: 'filter-pop', popover: 'auto', role: 'listbox', 'aria-label': defaultLabel });
    const btn = h('button', {
      class: 'filter-drop-btn',
      'data-filter-drop': key,
      'aria-haspopup': 'listbox',
      onClick: () => {
        if (pop.matches(':popover-open')) {
          pop.hidePopover();
          return;
        }
        pop.showPopover();
        const r = btn.getBoundingClientRect();
        pop.style.top = `${Math.round(r.bottom + 6)}px`;
        pop.style.left = `${Math.max(16, Math.min(window.innerWidth - 220, Math.round(r.left)))}px`;
      },
    });
    fill(pop, ...options.map(([val, label]) => h('button', {
      class: 'filter-pop-opt',
      role: 'option',
      'data-opt-val': val,
      'data-tone': withTone && val !== 'all' ? val : null,
      'aria-selected': 'false',
      onClick: () => {
        state.atlas[key] = val;
        pop.hidePopover();
        syncAtlas(true);
      },
    },
    h('span', { style: 'display: inline-flex; align-items: center; gap: 6px;' },
      withTone && val !== 'all' ? h('span', { class: 'tone-dot', 'aria-hidden': 'true' }) : null,
      label),
    h('span', { class: 'drop-check-slot' }))));
    return h('div', { class: 'filter-drop-wrap' }, btn, pop);
  }

  function syncAtlasSeg() {
    for (const btn of document.querySelectorAll('#atlas-seg [data-atlas-seg]')) {
      btn.setAttribute('aria-selected', String(btn.dataset.atlasSeg === state.atlasSeg));
    }
    const signsSec = $('atlas-signs-sec');
    const cmpPanel = $('compare-panel');
    if (state.atlasSeg === 'signs') {
      signsSec.removeAttribute('data-mobile-hidden');
      cmpPanel.dataset.mobileHidden = 'true';
    } else {
      signsSec.dataset.mobileHidden = 'true';
      cmpPanel.removeAttribute('data-mobile-hidden');
    }
    const af = $('atlas-filter-sticky');
    const panelVisible = Boolean($('panel-atlas') && !$('panel-atlas').hidden);
    if (af) af.dataset.stuck = String(panelVisible && !desktopMQ.matches && state.atlasSeg === 'signs' && af.getBoundingClientRect().top <= 58);
  }

  function buildAtlasFilters() {
    const totalSigns = KB.tongue_signs.length;
    const withFigCount = KB.tongue_signs.filter(x => x.fig_id).length;
    $('atlas-meta').textContent = `${totalSigns} 种舌象 · ${withFigCount} 种配原书图`;
    $('atlas-seg-signs-count').textContent = String(totalSigns);
    $('atlas-seg-cmp-count').textContent = String(KB.compare_pairs.length);

    const levels = ['all', 'normal', 'warning', 'high_alert'];
    const levelCount = lv => (lv === 'all' ? totalSigns : KB.tongue_signs.filter(x => x.risk_level === lv).length);
    const tagOpts = getAtlasTagOptions();

    const riskSeg = h('div', { class: 'seg-track atlas-risk-seg', role: 'radiogroup', 'aria-label': '风险等级' },
      levels.map(lv => h('button', {
        class: 'seg-btn',
        role: 'radio',
        'data-value': lv,
        'aria-checked': String(state.atlas.risk === lv),
        'aria-pressed': String(state.atlas.risk === lv),
        onClick: () => {
          state.atlas.risk = lv;
          syncAtlas(true);
        },
      },
      h('span', null, lv === 'all' ? '全部' : RISK_LABEL[lv]),
      h('span', { class: 'seg-count' }, String(levelCount(lv))))));

    const mobileFilterBtn = h('button', {
      class: 'atlas-drawer-btn',
      id: 'atlas-drawer-btn',
      'aria-haspopup': 'dialog',
      onClick: e => openSheet({ type: 'atlas-filter', compact: true }, e.currentTarget),
    }, iconSvg('sliders', 'icon-sm'), h('span', { id: 'atlas-drawer-btn-txt' }, '筛选'));

    const desktopSelects = h('div', { class: 'atlas-selects-desktop' },
      buildFilterDropdown('pop-atlas-const', 'constitution', '体质', [['all', '全部'], ...KB.constitutions.map(c => [c.id, shortName(c)])], true),
      buildFilterDropdown('pop-atlas-zone', 'zone', '舌面分区', [['all', '全部'], ...KB.tongue_zones.map(z => [z.id, z.name])]),
      buildFilterDropdown('pop-atlas-tag', 'tag', '预警标签', [['all', '全部'], ...tagOpts.map(([t, n]) => [t, `${t}（${n}）`])]),
      h('button', {
        class: 'text-link-btn',
        id: 'atlas-reset-bar-btn',
        onClick: () => {
          state.atlas = { ...ATLAS_DEFAULT };
          syncAtlas(true);
        },
      }, '重置'));

    fill($('atlas-filters'), riskSeg, mobileFilterBtn, desktopSelects);
  }

  function syncAtlas(resetScroll = false) {
    const f = state.atlas;

    for (const btn of document.querySelectorAll('#atlas-filters [data-value]')) {
      const on = btn.dataset.value === f.risk;
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-checked', String(on));
    }

    const extraCount = ['constitution', 'zone', 'tag'].filter(k => f[k] !== 'all').length;
    const drawerBtn = $('atlas-drawer-btn');
    if (drawerBtn) {
      drawerBtn.dataset.active = String(extraCount > 0);
      if (!extraCount) drawerBtn.removeAttribute('data-active');
      $('atlas-drawer-btn-txt').textContent = extraCount > 0 ? `筛选 · ${extraCount}` : '筛选';
      drawerBtn.setAttribute('aria-label', extraCount > 0 ? `筛选：已选 ${extraCount} 项` : '筛选');
    }

    const syncDrop = (key, defaultLabel, labelFn, withTone = false) => {
      const btn = document.querySelector(`[data-filter-drop="${key}"]`);
      const pop = btn?.nextElementSibling;
      if (!btn || !pop) return;
      const active = f[key] !== 'all';
      btn.dataset.active = active ? 'true' : '';
      if (!active) btn.removeAttribute('data-active');
      if (withTone && active) btn.dataset.tone = f[key];
      else btn.removeAttribute('data-tone');
      fill(btn,
        withTone && active ? h('span', { class: 'tone-dot', 'aria-hidden': 'true' }) : null,
        active ? labelFn(f[key]) : defaultLabel,
        iconSvg('chevron-down', 'icon-xs'));
      for (const opt of pop.querySelectorAll('[data-opt-val]')) {
        const on = opt.dataset.optVal === f[key];
        opt.setAttribute('aria-selected', String(on));
        fill(opt.querySelector('.drop-check-slot'), on ? iconSvg('check', 'icon-xs') : null);
      }
    };

    syncDrop('constitution', '体质', v => shortName(CONST.get(v)), true);
    syncDrop('zone', '舌面分区', v => ZONE.get(v).name);
    syncDrop('tag', '预警标签', v => v);

    const resetBtn = $('atlas-reset-bar-btn');
    const allDefault = Object.entries(ATLAS_DEFAULT).every(([k, v]) => f[k] === v);
    if (resetBtn) resetBtn.disabled = allDefault;

    const chipsRow = $('atlas-active-chips');
    if (!tabletUpMQ.matches && extraCount > 0) {
      chipsRow.hidden = false;
      const activeChips = [];
      if (f.constitution !== 'all') {
        activeChips.push(h('button', {
          class: 'active-filter-chip',
          onClick: () => { state.atlas.constitution = 'all'; syncAtlas(true); },
        }, `体质：${shortName(CONST.get(f.constitution))}`, iconSvg('cross', 'icon-xxs')));
      }
      if (f.zone !== 'all') {
        activeChips.push(h('button', {
          class: 'active-filter-chip',
          onClick: () => { state.atlas.zone = 'all'; syncAtlas(true); },
        }, `分区：${ZONE.get(f.zone).name}`, iconSvg('cross', 'icon-xxs')));
      }
      if (f.tag !== 'all') {
        activeChips.push(h('button', {
          class: 'active-filter-chip',
          onClick: () => { state.atlas.tag = 'all'; syncAtlas(true); },
        }, `预警：${f.tag}`, iconSvg('cross', 'icon-xxs')));
      }
      activeChips.push(h('button', {
        class: 'text-link-btn',
        onClick: () => { state.atlas = { ...ATLAS_DEFAULT }; syncAtlas(true); },
      }, '重置'));
      fill(chipsRow, ...activeChips);
    } else {
      chipsRow.hidden = true;
      fill(chipsRow);
    }

    const list = getFilteredAtlasSigns();
    syncAtlasOriginSlot();
    $('atlas-count').textContent = list.length
      ? `显示 ${list.length} / ${KB.tongue_signs.length} 种舌象，其中 ${list.filter(sItem => sItem.fig_id).length} 种配有原书图`
      : `显示 0 / ${KB.tongue_signs.length} 种舌象`;

    const scopeIds = list.map(x => x.id);
    if (!list.length) {
      fill($('sign-grid'), h('div', { class: 'empty-state', style: 'grid-column: 1 / -1;' },
        iconSvg('search', 'empty-state-icon'),
        h('p', { class: 'empty-state-title' }, '没有符合条件的舌象'),
        h('p', { class: 'empty-state-sub' }, '换一个风险等级，或减少筛选条件'),
        h('button', {
          class: 'btn btn-ghost',
          onClick: () => { state.atlas = { ...ATLAS_DEFAULT }; syncAtlas(true); },
        }, '重置筛选')));
    } else {
      fill($('sign-grid'), ...list.map(sign => buildAtlasCard(sign, scopeIds)));
    }

    if (resetScroll && desktopMQ.matches) {
      $('atlas-grid-scroll').scrollTop = 0;
    }
  }

  function buildAtlasCard(sign, scopeIds) {
    const hasFig = Boolean(sign.fig_id && !state.failedFigs.has(sign.fig_id));
    const failed = Boolean(sign.fig_id && state.failedFigs.has(sign.fig_id));
    const card = h('button', {
      class: 'sign-card',
      role: 'listitem',
      'data-sign-id': sign.id,
      'data-risk': sign.risk_level,
      title: sign.title,
      'aria-label': `${plainText(sign.title)}，${RISK_LABEL[sign.risk_level]}，原书第 ${sign.page} 页${hasFig ? '' : '，原书无配图'}`,
      onClick: e => openSign(sign.id, scopeIds, e.currentTarget),
    });

    const stageContainer = h('div', { style: 'width: 100%;' });
    if (hasFig) {
      fill(stageContainer, h('div', { class: 'sign-card-stage' },
        figImg(sign.fig_id, {
          alt: `${sign.title}（原书图）`,
          onFail: () => fill(stageContainer, noFigBoard(sign.visual_features, true)),
        })));
    } else {
      fill(stageContainer, noFigBoard(sign.visual_features, failed));
    }

    const allTagNodes = [
      ...sign.constitution_ids.map(toneTag),
      ...sign.alert_tags.map(t => h('span', { class: 'alert-tag' }, t)),
    ];
    const shownTags = allTagNodes.length > 3
      ? [...allTagNodes.slice(0, 2), h('span', { class: 'caption-note' }, `+${allTagNodes.length - 2}`)]
      : allTagNodes;

    fill(card,
      stageContainer,
      h('div', { class: 'sign-card-meta' },
        riskBadge(sign.risk_level, 'md'),
        h('span', { class: 'sign-card-page' }, `P.${sign.page}`)),
      h('span', { class: 'sign-card-title' }, sign.title),
      h('div', { class: 'sign-card-tags' }, shownTags));

    return card;
  }

  function buildComparePicker() {
    fill($('compare-picker'), ...KB.compare_pairs.map((p, i) => {
      const [partA, partB] = p.title.split(/\s+vs\s+/i);
      return h('button', {
        class: 'switch-chip',
        role: 'tab',
        'data-pair': p.id,
        title: p.title,
        'aria-label': `第 ${i + 1} 组：${p.title}`,
        'aria-selected': String(p.id === state.pair),
        'aria-pressed': String(p.id === state.pair),
        onClick: () => {
          state.pair = p.id;
          renderCompare();
          if (!desktopMQ.matches) {
            const stageEl = $('compare-stage');
            if (stageEl && stageEl.getBoundingClientRect().top > window.innerHeight * 0.72) {
              stageEl.scrollIntoView({ behavior: scrollMode(), block: 'nearest' });
            }
          }
        },
      },
      h('span', { class: 'chip-num-ring' }, String(i + 1)),
      h('span', { class: 'cmp-pair-lines' },
        h('span', { class: 'cmp-pair-a' }, partA || p.title),
        partB ? h('span', { class: 'cmp-pair-b' }, `vs ${partB}`) : null));
    }));
  }

  function buildCompareStageNodes(pair) {
    const buildMediaSlot = (letter, item) => {
      const hasFig = Boolean(item.fig_id && !state.failedFigs.has(item.fig_id));
      if (!hasFig) {
        return noFigBoard(item.key_feature, Boolean(item.fig_id));
      }
      const pool = [{ figId: item.fig_id, caption: `${letter} · ${item.label} · P.${item.page}` }];
      return h('button', {
        class: 'cmp-stage-btn',
        'aria-label': `放大查看 ${letter}：${item.label}`,
        onClick: e => openLightbox(pool, 0, e.currentTarget),
      }, figImg(item.fig_id, { alt: `${letter} · ${item.label}` }));
    };

    const buildNameCol = (letter, item) => h('div', { class: 'cmp-name-col' },
      h('div', { class: 'cmp-name-top' },
        h('span', { class: 'cmp-ab-badge' }, letter),
        h('h3', { class: 'cmp-item-name' }, item.label)),
      h('div', null, pageLink(item.page, true)));

    const diffItem = (letter, txt) => h('div', { class: 'cmp-diff-item' },
      h('span', { class: 'cmp-ab-mini', 'aria-hidden': 'true' }, letter),
      h('p', null, richText(txt)));

    return [
      h('div', { class: 'cmp-media-row' },
        buildMediaSlot('A', pair.item_a),
        h('span', { class: 'cmp-vs-badge', 'aria-hidden': 'true' }, 'VS'),
        buildMediaSlot('B', pair.item_b)),
      h('div', { class: 'cmp-names-row' },
        buildNameCol('A', pair.item_a),
        h('span', null),
        buildNameCol('B', pair.item_b)),
      h('section', { class: 'embed-accent cmp-rule-box' },
        h('span', { class: 'embed-accent-label' }, '鉴别要诀'),
        h('p', { class: 'embed-accent-body' }, richText(pair.distinguishing_rule))),
      h('section', { class: 'cmp-diff-section' },
        h('div', { class: 'cmp-diff-head' }, h('h4', { class: 'group-label' }, '关键特征')),
        h('div', { class: 'cmp-diff-cols' },
          diffItem('A', pair.item_a.key_feature),
          diffItem('B', pair.item_b.key_feature))),
      h('section', { class: 'cmp-diff-section' },
        h('div', { class: 'cmp-diff-head' }, h('h4', { class: 'group-label' }, '临床提示')),
        h('div', { class: 'cmp-diff-cols' },
          diffItem('A', pair.item_a.meaning),
          diffItem('B', pair.item_b.meaning))),
    ];
  }

  function renderCompare() {
    const idx = KB.compare_pairs.findIndex(p => p.id === state.pair);
    const pair = KB.compare_pairs[idx];
    for (const btn of document.querySelectorAll('#compare-picker [data-pair]')) {
      const on = btn.dataset.pair === state.pair;
      btn.setAttribute('aria-selected', String(on));
      btn.setAttribute('aria-pressed', String(on));
    }
    $('compare-total-note').textContent = `第 ${idx + 1} / ${KB.compare_pairs.length} 组`;
    $('cmp-prev-btn').disabled = idx <= 0;
    $('cmp-next-btn').disabled = idx >= KB.compare_pairs.length - 1;
    fill($('compare-stage'), ...buildCompareStageNodes(pair));
  }

  /* =========================================================
     13. UNIFIED SignDialog & FigureLightbox (§2.8)
     ========================================================= */
  function openSign(id, scopeIds = null, triggerEl = document.activeElement) {
    closeCitePopover(false);
    const pool = scopeIds && scopeIds.length ? scopeIds : [id];
    let idx = pool.indexOf(id);
    if (idx === -1) {
      pool.unshift(id);
      idx = 0;
    }
    state.signModalCtx = { ids: pool, index: idx };
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(signDialog, triggerEl);
    renderSignDialog();
    if (!signDialog.open) {
      signDialog.showModal();
      pushModalHistory('sign');
    }
  }

  function stepSignModal(delta) {
    const ctx = state.signModalCtx;
    if (!ctx) return;
    const next = ctx.index + delta;
    if (next < 0 || next >= ctx.ids.length) return;
    closeCitePopover(false);
    ctx.index = next;
    renderSignDialog();
  }

  function renderSignDialog() {
    const ctx = state.signModalCtx;
    if (!ctx) return;
    const sign = SIGN.get(ctx.ids[ctx.index]);
    const fig = sign.fig_id && !state.failedFigs.has(sign.fig_id) ? FIG.get(sign.fig_id) : null;
    signDialog.dataset.nofig = fig ? '' : 'true';
    if (fig) signDialog.removeAttribute('data-nofig');

    const mediaPart = fig ? h('figure', { class: 'sign-dlg-media' },
      figImg(fig.fig_id, { alt: sign.title, lazy: false }),
      h('figcaption', { class: 'sign-dlg-caption' }, `原书图 P.${fig.page} · ${fig.book_caption}`)) : null;

    const inZonesTab = state.tab === 'zones';
    const hasRelations = sign.constitution_ids.length || sign.zone_ids.length || sign.remedy_ids.length;

    const infoPart = h('div', { class: 'sign-dlg-info' },
      !fig ? h('p', { class: 'nofig-board-head' }, iconSvg('doc', 'icon-xs'), '原书无配图 · 文字描述') : null,
      h('div', { style: 'display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding-right: 40px;' },
        riskBadge(sign.risk_level, 'md'),
        ...sign.alert_tags.map(t => h('span', { class: 'alert-tag' }, t)),
        pageLink(sign.page, true)),
      h('h2', { class: 'sign-dlg-title', id: 'sign-dialog-title' }, sign.title),
      sign.visual_features ? h('section', { class: 'sign-dlg-field' },
        h('h3', { class: 'sign-dlg-field-label' }, '望诊特征'),
        h('p', { class: 'sign-dlg-field-text' }, richText(sign.visual_features))) : null,
      sign.clinical_meaning ? h('section', { class: 'sign-dlg-field' },
        h('h3', { class: 'sign-dlg-field-label' }, '临床意义'),
        h('p', { class: 'sign-dlg-field-text' }, richText(sign.clinical_meaning))) : null,
      sign.differential_tip ? h('section', { class: 'embed-accent' },
        h('span', { class: 'embed-accent-label' }, '鉴别要点'),
        h('p', { class: 'sign-dlg-field-text' }, richText(sign.differential_tip))) : null,
      sign.action_principle ? h('section', { class: 'embed-secondary' },
        h('span', { class: 'embed-secondary-label' }, '处置原则'),
        h('p', { class: 'embed-secondary-body' }, richText(sign.action_principle))) : null,
      hasRelations ? h('div', { style: 'border-top: 1px solid var(--border-hairline); padding-top: 14px; display: flex; flex-direction: column; gap: 12px;' },
        sign.constitution_ids.length ? h('div', { class: 'meta-kv-row' },
          h('span', { class: 'caption-note' }, '关联体质'),
          h('div', { class: 'meta-kv-items' }, sign.constitution_ids.map(constChip))) : null,
        sign.zone_ids.length ? h('div', { class: 'meta-kv-row' },
          h('span', { class: 'caption-note' }, '舌面分区'),
          h('div', { class: 'meta-kv-items' }, sign.zone_ids.map(zid => zoneChipBtn(zid, inZonesTab)))) : null,
        sign.remedy_ids.length ? h('div', { class: 'meta-kv-row' },
          h('span', { class: 'caption-note' }, '关联调理方法'),
          h('div', { class: 'meta-kv-items' }, sign.remedy_ids.map(remedyChip))) : null) : null,
      tabletUpMQ.matches && ctx.ids.length > 1 ? h('div', { style: 'margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-hairline); display: flex; align-items: center; justify-content: space-between; gap: 8px;' },
        h('button', {
          class: 'btn-ghost-sm',
          disabled: ctx.index <= 0,
          onClick: () => stepSignModal(-1),
        }, '‹ 上一种'),
        h('span', { class: 'sheet-foot-count' }, `${ctx.index + 1} / ${ctx.ids.length}`),
        h('button', {
          class: 'btn-ghost-sm',
          disabled: ctx.index >= ctx.ids.length - 1,
          onClick: () => stepSignModal(1),
        }, '下一种 ›')) : null);

    const mobileFoot = !tabletUpMQ.matches && ctx.ids.length > 1 ? h('footer', { class: 'sheet-foot' },
      h('button', {
        class: 'btn btn-ghost',
        disabled: ctx.index <= 0,
        onClick: () => stepSignModal(-1),
      }, '‹ 上一种'),
      h('span', { class: 'sheet-foot-count' }, `${ctx.index + 1} / ${ctx.ids.length}`),
      h('button', {
        class: 'btn btn-primary',
        disabled: ctx.index >= ctx.ids.length - 1,
        onClick: () => stepSignModal(1),
      }, '下一种 ›')) : null;

    fill($('sign-dialog-content'),
      h('div', { class: 'sign-dlg-body', 'data-has-fig': fig ? 'true' : null }, mediaPart, infoPart),
      mobileFoot);
  }

  function openLightbox(items, index = 0, triggerEl = document.activeElement) {
    if (!items || !items.length) return;
    closeCitePopover(false);
    state.lightboxCtx = { items, index: Math.max(0, index) };
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(lightboxDialog, triggerEl);
    renderLightbox();
    if (!lightboxDialog.open) {
      lightboxDialog.showModal();
      pushModalHistory('lightbox');
    }
  }

  function stepLightbox(delta) {
    const ctx = state.lightboxCtx;
    if (!ctx) return;
    const next = ctx.index + delta;
    if (next < 0 || next >= ctx.items.length) return;
    ctx.index = next;
    renderLightbox();
  }

  function renderLightbox() {
    const ctx = state.lightboxCtx;
    if (!ctx) return;
    const cur = ctx.items[ctx.index];
    fill($('lightbox-stage'), figImg(cur.figId, { alt: cur.caption, lazy: false }));
    $('lightbox-caption').textContent = cur.caption;

    const foot = $('lightbox-foot');
    const multi = ctx.items.length > 1;
    const canPickWizardOpt = Boolean(cur.optionId && !cur.locked);
    if (!multi && !canPickWizardOpt) {
      foot.hidden = true;
      fill(foot);
      return;
    }
    foot.hidden = false;
    fill(foot,
      multi ? h('button', {
        class: 'btn btn-ghost',
        disabled: ctx.index <= 0,
        onClick: () => stepLightbox(-1),
      }, '‹ 上一幅') : h('span', null),
      multi ? h('span', { class: 'sheet-foot-count' }, `${ctx.index + 1} / ${ctx.items.length}`) : h('span', null),
      h('div', { style: 'display: flex; align-items: center; gap: 8px;' },
        multi ? h('button', {
          class: 'btn btn-ghost',
          disabled: ctx.index >= ctx.items.length - 1,
          onClick: () => stepLightbox(1),
        }, '下一幅 ›') : null,
        canPickWizardOpt ? h('button', {
          class: 'btn btn-primary',
          onClick: () => {
            chooseOption(cur.stepId, cur.optionId, false);
            lightboxDialog.close();
          },
        }, '选这项') : null));
  }

  /* =========================================================
     14. TAB 5: 方 · 调理与红线 (§6.5 & §9.5)
     ========================================================= */
  function getRemedySearchParts(r) {
    return [
      ['名称', [r.name]],
      ['类别', [METHOD_LABEL[r.method_type]]],
      ['体质', r.constitution_ids.map(cid => CONST.get(cid).name)],
      ['禁忌与红线', r.contraindications],
      ['组成', r.ingredients.map(ing => `${ing.name} ${ing.amount} ${ing.note || ''}`)],
      ['制法与用法', [r.preparation_and_usage]],
      ['适用情形', r.indications],
      ['加减变化', r.modifications],
      ['方理机制', [r.mechanism]],
    ];
  }

  function normQuery(str) {
    return str.trim().toLowerCase();
  }

  function getFilteredRemedies() {
    const f = state.remedy;
    const terms = normQuery(f.keyword).split(/\s+/).filter(Boolean);
    return KB.remedies.filter(r => {
      if (f.type !== 'all' && r.method_type !== f.type) return false;
      if (f.constitution !== 'all' && !r.constitution_ids.includes(f.constitution)) return false;
      if (!terms.length) return true;
      const hay = getRemedySearchParts(r).flatMap(([, arr]) => arr).join(' ').toLowerCase();
      return terms.every(t => hay.includes(t));
    });
  }

  function buildRemedyFilters() {
    const typeCount = t => (t === 'all' ? KB.remedies.length : KB.remedies.filter(r => r.method_type === t).length);

    const searchInput = h('input', {
      id: 'remedy-keyword',
      class: 'remedy-search-input',
      type: 'search',
      enterkeyhint: 'search',
      autocomplete: 'off',
      placeholder: '药材、症状或禁忌，如：孕妇',
      'aria-label': '在调理方法中筛选',
      onInput: e => {
        state.remedy.keyword = e.currentTarget.value;
        $('remedy-kw-clear').hidden = !state.remedy.keyword;
        onRemedyFilterChange();
      },
      onKeydown: e => {
        if (e.key === 'Escape' && state.remedy.keyword) {
          e.preventDefault();
          e.stopPropagation();
          state.remedy.keyword = '';
          searchInput.value = '';
          $('remedy-kw-clear').hidden = true;
          onRemedyFilterChange();
        } else if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
          e.preventDefault();
          const first = document.querySelector('#remedy-grid [data-remedy-id]');
          if (first) first.focus();
        }
      },
    });

    const clearBtn = h('button', {
      class: 'search-clear-btn',
      id: 'remedy-kw-clear',
      'aria-label': '清空筛选词',
      hidden: true,
      onClick: () => {
        state.remedy.keyword = '';
        searchInput.value = '';
        clearBtn.hidden = true;
        onRemedyFilterChange();
        searchInput.focus();
      },
    }, iconSvg('cross', 'icon-xs'));

    const constPop = h('div', { id: 'pop-remedy-const', class: 'filter-pop', popover: 'auto', role: 'listbox', 'aria-label': '适用体质' });
    const constBtn = h('button', {
      class: 'remedy-const-btn',
      id: 'remedy-const-btn',
      'aria-haspopup': 'listbox',
      onClick: e => {
        if (!desktopMQ.matches) {
          openSheet({ type: 'remedy-const', compact: true }, e.currentTarget);
          return;
        }
        if (constPop.matches(':popover-open')) {
          constPop.hidePopover();
          return;
        }
        constPop.showPopover();
        const r = constBtn.getBoundingClientRect();
        constPop.style.top = `${Math.round(r.bottom + 6)}px`;
        constPop.style.left = `${Math.max(16, Math.min(window.innerWidth - 220, Math.round(r.right - 200)))}px`;
      },
    });

    const constOpts = [['all', '全部体质', KB.remedies.length], ...KB.constitutions.map(c => [
      c.id,
      c.name,
      KB.remedies.filter(r => r.constitution_ids.includes(c.id)).length,
    ])];
    fill(constPop, ...constOpts.map(([val, label, cnt]) => h('button', {
      class: 'filter-pop-opt',
      role: 'option',
      'data-opt-val': val,
      'data-tone': val !== 'all' ? val : null,
      'aria-selected': 'false',
      onClick: () => {
        state.remedy.constitution = val;
        constPop.hidePopover();
        onRemedyFilterChange();
      },
    },
    h('span', { style: 'display: inline-flex; align-items: center; gap: 6px;' },
      val !== 'all' ? h('span', { class: 'tone-dot', 'aria-hidden': 'true' }) : null,
      label),
    h('span', { class: 'caption-note' }, String(cnt)))));

    const catTrack = h('div', { class: 'seg-track remedy-cat-track', role: 'tablist', 'aria-label': '方法类型' },
      ['all', ...METHOD_ORDER].map(t => {
        const cnt = typeCount(t);
        const tip = t === 'all' ? `全部 · ${cnt} 种` : `${METHOD_GLYPH[t]} · ${METHOD_LABEL[t]} · ${cnt} 种`;
        return h('button', {
          class: 'seg-btn',
          role: 'tab',
          'data-value': t,
          title: tip,
          'aria-label': tip,
          'aria-selected': String(state.remedy.type === t),
          'aria-pressed': String(state.remedy.type === t),
          onClick: e => {
            state.remedy.type = t;
            onRemedyFilterChange();
            if (!desktopMQ.matches) {
              e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: scrollMode() });
            }
          },
        },
        t === 'all'
          ? h('span', null, '全部')
          : [methodSeal(t, 'sm'), h('span', { class: 'remedy-cat-name' }, METHOD_LABEL[t])],
        h('span', { class: 'seg-count' }, String(cnt)));
      }));

    fill($('remedy-filters'),
      h('div', { class: 'remedy-filter-row-a' },
        h('div', { class: 'remedy-search-box' }, iconSvg('search', 'icon-sm'), searchInput, clearBtn),
        h('div', { class: 'filter-drop-wrap' }, constBtn, constPop)),
      h('div', { class: 'remedy-cat-rail' }, catTrack));
  }

  function syncRemedyFilters() {
    const f = state.remedy;
    const kwInput = $('remedy-keyword');
    if (kwInput && kwInput.value !== f.keyword) kwInput.value = f.keyword;
    const clearBtn = $('remedy-kw-clear');
    if (clearBtn) clearBtn.hidden = !f.keyword;

    for (const btn of document.querySelectorAll('#remedy-filters [data-value]')) {
      const on = btn.dataset.value === f.type;
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-selected', String(on));
    }

    const constBtn = $('remedy-const-btn');
    const constPop = $('pop-remedy-const');
    if (constBtn) {
      const active = f.constitution !== 'all';
      constBtn.dataset.active = active ? 'true' : '';
      if (!active) constBtn.removeAttribute('data-active');
      if (active) constBtn.dataset.tone = f.constitution;
      else constBtn.removeAttribute('data-tone');
      const label = active
        ? (desktopMQ.matches ? CONST.get(f.constitution).name : shortName(CONST.get(f.constitution)))
        : (desktopMQ.matches ? '全部体质' : '体质');
      fill(constBtn,
        active ? h('span', { class: 'tone-dot', 'aria-hidden': 'true' }) : null,
        label,
        iconSvg('chevron-down', 'icon-xs'));
    }
    if (constPop) {
      for (const opt of constPop.querySelectorAll('[data-opt-val]')) {
        opt.setAttribute('aria-selected', String(opt.dataset.optVal === f.constitution));
      }
    }
  }

  function onRemedyFilterChange() {
    syncRemedyFilters();
    renderRemedyGrid();
    const list = getFilteredRemedies();
    if (desktopMQ.matches && list.length && !list.some(r => r.id === state.selectedRemedyId)) {
      state.selectedRemedyId = list[0].id;
      renderRemedyDetailPanel();
    }
    syncListSelectionMarks();
  }

  function renderRemedyGrid() {
    const f = state.remedy;
    const terms = normQuery(f.keyword).split(/\s+/).filter(Boolean);
    const list = getFilteredRemedies();
    const isFiltered = f.type !== 'all' || f.constitution !== 'all' || terms.length > 0;

    $('remedy-count').textContent = `显示 ${list.length} / ${KB.remedies.length} 种`;
    $('remedy-reset-inline').hidden = !isFiltered;

    if (!list.length) {
      fill($('remedy-grid'), h('div', { class: 'empty-state' },
        iconSvg('search', 'empty-state-icon'),
        h('p', { class: 'empty-state-title' }, '没有符合条件的方法'),
        h('p', { class: 'empty-state-sub' }, '试试减少筛选条件，或换一个关键词'),
        h('button', {
          class: 'btn btn-ghost',
          onClick: () => {
            state.remedy = { ...REMEDY_DEFAULT };
            onRemedyFilterChange();
            $('remedy-keyword')?.focus();
          },
        }, '重置筛选')));
      return;
    }

    fill($('remedy-grid'), ...list.map(r => buildRemedyRow(r, terms)));
    syncListSelectionMarks();
  }

  function buildRemedyRow(r, terms) {
    const contras = r.contraindications.map(plainText);
    let contraSummary = contras[0] || '';
    let matchedInNameOrContra = false;

    if (terms.length) {
      const lowerName = r.name.toLowerCase();
      if (terms.some(t => lowerName.includes(t))) matchedInNameOrContra = true;
      const hitContra = contras.find(line => terms.some(t => line.toLowerCase().includes(t)));
      if (hitContra) {
        matchedInNameOrContra = true;
        const firstPos = Math.min(...terms.map(t => hitContra.toLowerCase().indexOf(t)).filter(p => p >= 0));
        if (Number.isFinite(firstPos) && firstPos > 6) {
          contraSummary = `…${hitContra.slice(firstPos - 6)}`;
        } else {
          contraSummary = hitContra;
        }
      }
    }

    let fieldHitLine = null;
    if (terms.length && !matchedInNameOrContra) {
      const checkSections = [
        ['组成', r.ingredients.map(ing => `${ing.name} ${ing.amount} ${plainText(ing.note || '')}`)],
        ['制法与用法', [plainText(r.preparation_and_usage)]],
        ['适用情形', r.indications.map(plainText)],
        ['加减变化', r.modifications.map(plainText)],
        ['方理机制', [plainText(r.mechanism)]],
      ];
      for (const [secName, arr] of checkSections) {
        const joined = arr.join('；');
        const lc = joined.toLowerCase();
        const at = Math.min(...terms.map(t => lc.indexOf(t)).filter(p => p >= 0));
        if (Number.isFinite(at)) {
          const start = Math.max(0, at - 8);
          const end = Math.min(joined.length, at + 16);
          const excerpt = `${start > 0 ? '…' : ''}${joined.slice(start, end)}${end < joined.length ? '…' : ''}`;
          fieldHitLine = h('span', { class: 'remedy-row-hit' }, `命中：${secName} · `, mark(excerpt, terms));
          break;
        }
      }
    }

    return h('button', {
      class: 'remedy-row',
      role: 'option',
      'data-remedy-id': r.id,
      'aria-label': `${plainText(r.name)}，${METHOD_LABEL[r.method_type]}，原书第 ${r.page} 页，禁忌 ${r.contraindications.length} 条`,
      onClick: e => {
        state.origin = null;
        state.selectedRemedyId = r.id;
        renderRemedyDetailPanel();
        syncListSelectionMarks();
        if (!desktopMQ.matches) {
          openRemedySheet(e.currentTarget);
        }
      },
    },
    methodSeal(r.method_type, 'lg'),
    h('span', { class: 'remedy-row-body' },
      h('span', { class: 'remedy-row-title' }, mark(r.name, terms)),
      h('span', { class: 'remedy-row-meta' },
        `${METHOD_LABEL[r.method_type]} · P.${r.page}`,
        r.constitution_ids.length ? ' · ' : null,
        ...r.constitution_ids.map(toneInline)),
      r.contraindications.length ? h('span', { class: 'remedy-row-contra' },
        h('span', { class: 'contra-pill' }, iconSvg('ban', 'icon-xxs'), `禁忌 ${r.contraindications.length}`),
        h('span', { class: 'contra-excerpt' }, mark(contraSummary, terms))) : null,
      fieldHitLine),
    iconSvg('chevron-right', 'icon-sm row-chevron'));
  }

  function openRemedySheet(triggerEl) {
    openSheet({ type: 'remedy-detail' }, triggerEl);
  }

  function formatContraLead(text, kw) {
    const colonIdx = text.indexOf('：');
    if (colonIdx > 0 && colonIdx <= 12) {
      const lead = text.slice(0, colonIdx + 1);
      const rest = text.slice(colonIdx + 1);
      return [h('strong', null, mark(lead, kw)), richText(rest, kw)];
    }
    return richText(text, kw);
  }

  function buildRemedyDetailNodes(r, inSheet = false) {
    const kw = normQuery(state.remedy.keyword).split(/\s+/).filter(Boolean);
    const list = getFilteredRemedies();
    const pool = list.length ? list : KB.remedies;
    const idx = Math.max(0, pool.findIndex(x => x.id === r.id));

    const jumpChipsRow = (inSheet || !wideDeskMQ.matches) ? h('div', { class: 'chip-wrap', style: 'margin-top: 4px;' },
      ...r.constitution_ids.map(cid => h('button', {
        class: 'jump-chip',
        'data-tone': cid,
        onClick: () => jumpToConstitution(cid, true),
      },
      h('span', { class: 'jump-tab-ring' }, '书'),
      h('span', { class: 'tone-dot', 'aria-hidden': 'true' }),
      CONST.get(cid).name,
      ' ›')),
      r.constitution_ids.length ? h('button', {
        class: 'jump-chip',
        onClick: () => jumpToAtlasByConst(r.constitution_ids[0], true),
      },
      h('span', { class: 'jump-tab-ring' }, '鉴'),
      '对应舌象 ›') : null) : null;

    const head = h('header', { class: 'detail-head' },
      !inSheet ? h('div', { class: 'detail-head-top' },
        h('div', { style: 'display: flex; align-items: center; gap: 10px;' },
          originBackButton(),
          h('p', { class: 'eyebrow' }, `${METHOD_LABEL[r.method_type]} · `, pageLink(r.page, true))),
        h('div', { class: 'panel-nav-btns' },
          h('button', {
            class: 'btn-ghost-sm',
            disabled: idx <= 0,
            onClick: () => {
              state.selectedRemedyId = pool[idx - 1].id;
              renderRemedyDetailPanel();
              syncListSelectionMarks();
            },
          }, '‹ 上一方'),
          h('button', {
            class: 'btn-ghost-sm',
            disabled: idx >= pool.length - 1,
            onClick: () => {
              state.selectedRemedyId = pool[idx + 1].id;
              renderRemedyDetailPanel();
              syncListSelectionMarks();
            },
          }, '下一方 ›'))) : null,
      h('h2', { class: 'detail-display' }, mark(r.name, kw)),
      jumpChipsRow);

    /* Block 1: RedlineCallout (FIXED FIRST, R2 shield) */
    const redlineId = inSheet ? 'sheet-rem-redline-title' : 'desk-rem-redline-title';
    const redlineBlock = r.contraindications.length ? h('section', {
      class: 'callout-r2',
      role: 'note',
      'aria-labelledby': redlineId,
    },
    h('div', { class: 'callout-r2-head' },
      h('h3', { class: 'callout-r2-title', id: redlineId }, iconSvg('shield', ''), '禁忌与红线'),
      h('span', { class: 'callout-r2-tag' }, `${r.contraindications.length} 条`)),
    h('ul', { class: 'callout-r2-list' },
      r.contraindications.map(line => h('li', { class: 'callout-r2-item' },
        iconSvg('cross', 'icon-sm'),
        h('span', null, formatContraLead(line, kw)))))) : null;

    /* Block 2: DoseList (0 -> omit; 1..9 -> single col; >=10 -> 2-col compact, notes span full row) */
    let doseBlock = null;
    if (r.ingredients.length > 0) {
      const compact = r.ingredients.length >= 10;
      doseBlock = h('section', null,
        sectionHeading(`组成 · ${r.ingredients.length} 项`),
        h('ul', { class: compact ? 'dose-list-compact' : 'dose-list' },
          r.ingredients.map(ing => {
            const hasNote = Boolean(ing.note && ing.note.trim());
            const longAmt = [...ing.amount].length > 8;
            const longName = [...ing.name].length > 6;
            return h('li', {
              class: 'dose-item',
              'data-full-row': hasNote || longAmt ? 'true' : null,
              'data-long-name': longName ? 'true' : null,
            },
            h('div', { class: 'dose-item-top', 'data-long-amt': longAmt ? 'true' : null },
              h('span', { class: 'dose-name' }, mark(ing.name, kw)),
              h('span', { class: 'dose-amount' }, mark(ing.amount, kw))),
            hasNote ? h('p', { class: 'dose-note' }, richText(ing.note, kw)) : null);
          })));
    }

    const usageBlock = r.preparation_and_usage ? h('section', null,
      sectionHeading('制法与用法'),
      h('p', { style: 'margin-top: 8px; font-size: 15px; line-height: 24px; color: var(--text-1);' }, richText(r.preparation_and_usage, kw))) : null;

    const indicationsItems = r.indications.map(txt => h('li', { class: 'indication-item' },
      iconSvg('check', 'icon-sm'),
      h('span', null, richText(txt, kw))));

    const modsBlock = r.modifications.length ? h('section', null,
      sectionHeading('加减变化'),
      h('ul', { class: 'ring-bullet-list' }, r.modifications.map(txt => h('li', { class: 'ring-bullet-item' }, richText(txt, kw))))) : null;

    const mechBlock = r.mechanism ? h('section', null,
      sectionHeading('方理机制'),
      h('p', { style: 'margin-top: 8px; font-size: 14px; line-height: 22px; color: var(--text-2);' }, richText(r.mechanism, kw))) : null;

    const fig = r.fig_id && !state.failedFigs.has(r.fig_id) ? FIG.get(r.fig_id) : null;
    const figBlock = fig ? h('section', null,
      sectionHeading('原书配图'),
      h('button', {
        class: 'remedy-fig-card',
        onClick: e => openLightbox([{ figId: fig.fig_id, caption: `P.${fig.page} · ${fig.book_caption}` }], 0, e.currentTarget),
      },
      h('span', { class: 'remedy-fig-stage img-stage' }, figImg(fig.fig_id, { alt: fig.book_caption })),
      h('span', { class: 'caption-note' }, `P.${fig.page} · ${fig.book_caption}`))) : null;

    if (inSheet || !wideDeskMQ.matches) {
      const indicationsSingle = r.indications.length ? h('section', null,
        sectionHeading('适用情形'),
        h('ul', { class: 'indication-list' }, indicationsItems)) : null;
      return [
        head,
        h('div', { class: 'detail-stack' },
          redlineBlock,
          doseBlock,
          usageBlock,
          indicationsSingle,
          modsBlock,
          mechBlock,
          figBlock),
      ];
    }

    const linkCards = [
      ...r.constitution_ids.map(cid => {
        const c = CONST.get(cid);
        const sCnt = (SIGNS_BY_CONST.get(cid) ?? []).length;
        return h('button', {
          class: 'link-card',
          onClick: () => jumpToConstitution(cid, true),
        },
        h('span', { class: 'jump-tab-ring jump-tab-ring-lg' }, '书'),
        h('span', { class: 'link-card-body' },
          h('span', { class: 'link-card-title' }, c.name),
          h('span', { class: 'caption-note' }, `${sCnt} 象 · ${c.primary_remedy_ids.length} 方`)),
        iconSvg('chevron-right', 'icon-sm row-chevron'));
      }),
      r.constitution_ids.length ? h('button', {
        class: 'link-card',
        onClick: () => jumpToAtlasByConst(r.constitution_ids[0], true),
      },
      h('span', { class: 'jump-tab-ring jump-tab-ring-lg' }, '鉴'),
      h('span', { class: 'link-card-body' },
        h('span', { class: 'link-card-title' }, '对应舌象'),
        h('span', { class: 'caption-note' }, `${CONST.get(r.constitution_ids[0]).name}关联图鉴`)),
      iconSvg('chevron-right', 'icon-sm row-chevron')) : null,
    ];

    const aside = h('div', { class: 'detail-aside', 'data-sticky': 'true' },
      r.indications.length ? h('section', { class: 'aside-card' },
        h('h3', { class: 'section-heading' }, iconSvg('check-circle', 'icon-sm'), '适用情形'),
        h('ul', { class: 'indication-list', style: 'margin-top: 0;' }, indicationsItems)) : null,
      modsBlock,
      linkCards.length ? h('section', { style: 'display: flex; flex-direction: column; gap: 8px;' },
        h('h4', { class: 'group-label' }, '关联'),
        ...linkCards) : null);

    return [
      head,
      h('div', { class: 'detail-wide-grid' },
        h('div', { class: 'detail-stack' }, redlineBlock, doseBlock, usageBlock, mechBlock, figBlock),
        aside),
    ];
  }

  function syncRemedyAsideSticky() {
    const panel = $('remedy-detail');
    const aside = panel?.querySelector('.detail-aside');
    if (!panel || !aside || !wideDeskMQ.matches) return;
    aside.dataset.sticky = String(aside.offsetHeight <= panel.clientHeight - 64);
  }

  function renderRemedyDetailPanel() {
    const panel = $('remedy-detail');
    const r = REMEDY.get(state.selectedRemedyId) || KB.remedies[0];
    fill(panel, ...buildRemedyDetailNodes(r, false));
    panel.scrollTop = 0;
    requestAnimationFrame(syncRemedyAsideSticky);
  }

  /* =========================================================
     15. TAB 6: 测 · 病因传导与闯关自测 (§6.6 & §9.6)
     ========================================================= */
  function setMasteryView(view) {
    state.masteryView = view;
    for (const btn of document.querySelectorAll('#mastery-view-switch [data-mastery-view]')) {
      btn.setAttribute('aria-selected', String(btn.dataset.masteryView === view));
    }
    $('mastery-causal-view').hidden = view !== 'causal';
    $('mastery-quiz-view').hidden = view !== 'quiz';
    if (view === 'causal') {
      requestAnimationFrame(() => renderCausal(false));
    } else {
      renderQuiz();
    }
  }

  function buildCausalPicker() {
    $('causal-total-count').textContent = String(CAUSAL.length);
    $('quiz-total-count').textContent = String(KB.quiz.length);
    $('mastery-meta').textContent = `${CAUSAL.length} 张传导图 · ${KB.quiz.length} 道情景题`;

    fill($('causal-picker'), ...CAUSAL.map(g => h('button', {
      class: 'switch-chip',
      role: 'tab',
      'data-graph': g.id,
      'aria-selected': String(g.id === state.graph),
      'aria-pressed': String(g.id === state.graph),
      onClick: () => {
        state.graph = g.id;
        renderCausal(false);
        if (!desktopMQ.matches) window.scrollTo({ top: 0, behavior: scrollMode() });
      },
    }, g.short)));
  }

  /* Auto-computed topology layout for Mobile Row Flow & Desktop Layered DAG (§9.6) */
  function roundedOrthoPath(pts, radius = 8) {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const dx1 = x1 - x0;
      const dy1 = y1 - y0;
      const len1 = Math.hypot(dx1, dy1);
      const dx2 = x2 - x1;
      const dy2 = y2 - y1;
      const len2 = Math.hypot(dx2, dy2);
      const r = Math.min(radius, len1 / 2, len2 / 2);
      if (r < 1) {
        d += ` L${x1},${y1}`;
      } else {
        const sx = x1 - (dx1 / len1) * r;
        const sy = y1 - (dy1 / len1) * r;
        const ex = x1 + (dx2 / len2) * r;
        const ey = y1 + (dy2 / len2) * r;
        d += ` L${sx.toFixed(1)},${sy.toFixed(1)} Q${x1},${y1} ${ex.toFixed(1)},${ey.toFixed(1)}`;
      }
    }
    const last = pts[pts.length - 1];
    d += ` L${last[0]},${last[1]}`;
    return d;
  }

  function computeCausalLayout(graph, containerWidth, isDesktop) {
    const nodeById = new Map(graph.nodes.map(n => [n.id, n]));
    const edgeSet = new Set(graph.edges.map(e => `${e.from}->${e.to}`));
    const isReciprocal = (u, v) => edgeSet.has(`${u}->${v}`) && edgeSet.has(`${v}->${u}`);

    if (!isDesktop) {
      const W = Math.max(288, containerWidth || 358);
      const visited = new Set();
      const ordered = [];
      const indent = new Map();
      const parentOf = new Map();

      const forwardOuts = id => graph.edges
        .filter(e => e.from === id)
        .map(e => nodeById.get(e.to))
        .filter(Boolean);

      function dfs(uId, ind) {
        if (visited.has(uId)) return;
        visited.add(uId);
        ordered.push(uId);
        indent.set(uId, ind);
        const outs = forwardOuts(uId);
        const warnChildren = outs.filter(n => n.kind === 'warn' && !visited.has(n.id));
        const normalChildren = outs.filter(n => n.kind !== 'warn' && !visited.has(n.id));
        const recipChildren = normalChildren.filter(n => isReciprocal(uId, n.id));
        const treeChildren = normalChildren.filter(n => !isReciprocal(uId, n.id));

        for (const rc of recipChildren) {
          parentOf.set(rc.id, uId);
          dfs(rc.id, ind);
        }
        for (const wc of warnChildren) {
          parentOf.set(wc.id, uId);
          dfs(wc.id, ind);
        }
        const childIndent = treeChildren.length >= 2 ? Math.min(2, ind + 1) : ind;
        for (const tc of treeChildren) {
          parentOf.set(tc.id, uId);
          dfs(tc.id, childIndent);
        }
      }

      for (const n of graph.nodes) {
        if (!visited.has(n.id)) dfs(n.id, 0);
      }

      const orderIdx = new Map(ordered.map((id, idx) => [id, idx]));
      const rightRails = graph.edges.filter(e => {
        if (isReciprocal(e.from, e.to)) return false;
        const fi = orderIdx.get(e.from);
        const ti = orderIdx.get(e.to);
        if (ti < fi) return true;
        const tgtNode = nodeById.get(e.to);
        if (tgtNode.kind === 'warn') return false;
        if (ti > fi + 1 && indent.get(e.to) <= indent.get(e.from)) {
          const betweenWarnOnly = ordered.slice(fi + 1, ti).every(mid => nodeById.get(mid).kind === 'warn');
          return !betweenWarnOnly;
        }
        return false;
      });

      const railZoneWidth = rightRails.length ? (32 + rightRails.length * 14) : 0;
      const rightLimit = W - railZoneWidth;

      const boxes = new Map();
      let curY = 0;
      ordered.forEach((id, idx) => {
        const n = nodeById.get(id);
        const ind = indent.get(id) || 0;
        let x = ind * 24;
        let w = rightLimit - x;
        if (n.kind === 'warn') {
          w = Math.min(200, rightLimit - 88);
          x = rightLimit - w;
        }
        w = Math.max(200, w);
        if (x + w > W) x = Math.max(0, W - w);
        const hBox = [...n.label].length > 12 ? 76 : 56;
        boxes.set(id, { x, y: curY, w, h: hBox, indent: ind });

        if (idx < ordered.length - 1) {
          const nextId = ordered[idx + 1];
          const nextNode = nodeById.get(nextId);
          let gap = 26;
          if (isReciprocal(id, nextId)) gap = 38;
          else if (nextNode.kind === 'warn' || n.kind === 'warn') gap = 24;
          curY += hBox + gap;
        } else {
          curY += hBox;
        }
      });

      let railCounter = 0;
      const edgeShapes = graph.edges.map(e => {
        const a = boxes.get(e.from);
        const b = boxes.get(e.to);
        const fi = orderIdx.get(e.from);
        const ti = orderIdx.get(e.to);
        const tgt = nodeById.get(e.to);

        if (isReciprocal(e.from, e.to)) {
          if (fi < ti) {
            const xLine = a.x + 36;
            return {
              edge: e,
              d: roundedOrthoPath([[xLine, a.y + a.h], [xLine, b.y - 2]]),
              lx: xLine + 6,
              ly: Math.round((a.y + a.h + b.y) / 2 - 8),
            };
          }
          const xLine = Math.min(a.x + a.w - 36, a.x + 156);
          return {
            edge: e,
            d: roundedOrthoPath([[xLine, a.y], [xLine, b.y + b.h + 2]]),
            lx: xLine + 6,
            ly: Math.round((b.y + b.h + a.y) / 2 - 8),
          };
        }

        if (rightRails.includes(e)) {
          const rx = W - 16 - railCounter * 14;
          railCounter++;
          const sy = a.y + Math.round(a.h / 2);
          const ey = b.y + Math.round(b.h / 2);
          return {
            edge: e,
            d: roundedOrthoPath([[a.x + a.w, sy], [rx, sy], [rx, ey], [b.x + b.w + 2, ey]]),
            lx: rx - 8,
            ly: Math.round((sy + ey) / 2 - 24),
            vertical: Math.abs(ey - sy) > 70,
          };
        }

        if (tgt.kind === 'warn') {
          const xLine = b.x + Math.round(b.w / 2);
          return {
            edge: e,
            d: roundedOrthoPath([[xLine, a.y + a.h], [xLine, b.y - 2]]),
            lx: xLine + 8,
            ly: Math.round((a.y + a.h + b.y) / 2 - 8),
          };
        }

        if (b.indent > a.indent) {
          const trunkX = a.x + 12;
          const ey = b.y + Math.round(b.h / 2);
          return {
            edge: e,
            d: roundedOrthoPath([[trunkX, a.y + a.h], [trunkX, ey], [b.x - 2, ey]]),
            lx: b.x + 2,
            ly: b.y - 21,
          };
        }

        const xLine = a.x + 28;
        return {
          edge: e,
          d: roundedOrthoPath([[xLine, a.y + a.h], [xLine, b.y - 2]]),
          lx: xLine + 8,
          ly: Math.round((a.y + a.h + b.y) / 2 - 8),
        };
      });

      return { width: W, height: curY + 8, boxes, edgeShapes };
    }

    /* Desktop Layered Layout (>= 1080px) */
    const W = wideDeskMQ.matches ? 512 : 432;
    const hasWarnBranch = graph.nodes.some(n => n.kind === 'warn');
    const boxes = new Map();
    const edgeShapes = [];

    if (hasWarnBranch) {
      const mainNodes = graph.nodes.filter(n => n.kind !== 'warn');
      const warnNodes = graph.nodes.filter(n => n.kind === 'warn');
      const mainW = wideDeskMQ.matches ? 332 : 268;
      const warnW = wideDeskMQ.matches ? 136 : 124;
      const nodeH = 68;
      const rowStep = 114;

      mainNodes.forEach((n, idx) => {
        boxes.set(n.id, { x: 0, y: 8 + idx * rowStep, w: mainW, h: nodeH });
      });
      warnNodes.forEach(wn => {
        const inEdge = graph.edges.find(e => e.to === wn.id);
        const pBox = inEdge ? boxes.get(inEdge.from) : { y: 120 };
        boxes.set(wn.id, { x: W - warnW - 24, y: pBox.y + 62, w: warnW, h: nodeH });
      });

      for (const e of graph.edges) {
        const a = boxes.get(e.from);
        const b = boxes.get(e.to);
        const src = nodeById.get(e.from);
        const tgt = nodeById.get(e.to);
        if (tgt.kind === 'warn') {
          const sy = a.y + Math.round(a.h / 2);
          const bx = b.x + Math.round(b.w / 2);
          edgeShapes.push({
            edge: e,
            d: roundedOrthoPath([[a.x + a.w, sy], [bx, sy], [bx, b.y - 2]]),
            lx: a.x + a.w + 8,
            ly: sy - 18,
          });
        } else if (src.kind === 'warn') {
          const rx = W - 10;
          const sy = a.y;
          const ey = b.y + Math.round(b.h / 2);
          edgeShapes.push({
            edge: e,
            d: roundedOrthoPath([[rx - 14, sy], [rx - 14, ey], [b.x + b.w + 2, ey]]),
            lx: rx - 32,
            ly: Math.round((sy + ey) / 2 - 24),
            vertical: true,
          });
        } else {
          const cx = Math.round(mainW / 2);
          edgeShapes.push({
            edge: e,
            d: roundedOrthoPath([[cx, a.y + a.h], [cx, b.y - 2]]),
            lx: cx + 10,
            ly: Math.round((a.y + a.h + b.y) / 2 - 8),
          });
        }
      }
      const totalH = 8 + (mainNodes.length - 1) * rowStep + nodeH + 8;
      return { width: W, height: totalH, boxes, edgeShapes };
    }

    /* General layered DAG with reciprocal same-layer grouping (covers Graph ① & ③) */
    const depth = new Map(graph.nodes.map(n => [n.id, 0]));
    for (let pass = 0; pass < graph.nodes.length; pass++) {
      for (const e of graph.edges) {
        if (isReciprocal(e.from, e.to)) {
          const mx = Math.max(depth.get(e.from), depth.get(e.to));
          depth.set(e.from, mx);
          depth.set(e.to, mx);
        } else {
          depth.set(e.to, Math.max(depth.get(e.to), depth.get(e.from) + 1));
        }
      }
    }

    const maxDepth = Math.max(...depth.values());
    const layers = Array.from({ length: maxDepth + 1 }, () => []);
    for (const n of graph.nodes) layers[depth.get(n.id)].push(n);

    const estLabelW = txt => [...txt].reduce((sum, ch) => sum + (/[\u4e00-\u9fff]/.test(ch) ? 17.5 : 8.5), 0);
    const layerGap = 64;
    let curY = 16;
    layers.forEach(layerNodes => {
      const cnt = layerNodes.length;
      const gap = cnt === 2 && isReciprocal(layerNodes[0].id, layerNodes[1].id) ? 92 : 16;
      const w = cnt === 1
        ? Math.min(340, W)
        : Math.floor((W - gap * (cnt - 1)) / cnt);
      const availTextW = w - 28 - 42;
      const wraps = layerNodes.some(n => estLabelW(n.label) > availTextW);
      const layerH = wraps ? 94 : 68;
      const totalRowW = cnt * w + (cnt - 1) * gap;
      const startX = Math.round((W - totalRowW) / 2);
      layerNodes.forEach((n, idx) => {
        boxes.set(n.id, { x: startX + idx * (w + gap), y: curY, w, h: layerH });
      });
      curY += layerH + layerGap;
    });

    for (const e of graph.edges) {
      const a = boxes.get(e.from);
      const b = boxes.get(e.to);
      if (isReciprocal(e.from, e.to)) {
        if (a.x < b.x) {
          const yLine = a.y + Math.round(a.h * 0.34);
          edgeShapes.push({
            edge: e,
            d: roundedOrthoPath([[a.x + a.w, yLine], [b.x - 2, yLine]]),
            lx: Math.round((a.x + a.w + b.x) / 2 - 28),
            ly: yLine - 18,
          });
        } else {
          const yLine = a.y + Math.round(a.h * 0.68);
          edgeShapes.push({
            edge: e,
            d: roundedOrthoPath([[a.x, yLine], [b.x + b.w + 2, yLine]]),
            lx: Math.round((b.x + b.w + a.x) / 2 - 24),
            ly: yLine + 6,
          });
        }
      } else {
        const sx = a.x + Math.round(a.w / 2);
        const sy = a.y + a.h;
        let tx = b.x + Math.round(b.w / 2);
        const incomingSame = graph.edges.filter(x => x.to === e.to && !isReciprocal(x.from, x.to));
        if (incomingSame.length === 2) {
          const idxIn = incomingSame.indexOf(e);
          tx = b.x + Math.round(b.w * (idxIn === 0 ? 0.34 : 0.66));
        }
        const midY = Math.round((sy + b.y) / 2);
        const straightY = Math.abs(sx - tx) < 3;
        const pts = straightY
          ? [[sx, sy], [tx, b.y - 2]]
          : [[sx, sy], [sx, midY], [tx, midY], [tx, b.y - 2]];
        edgeShapes.push({
          edge: e,
          d: roundedOrthoPath(pts),
          lx: straightY ? sx - 22 : incomingSame.length === 1 ? Math.round(tx - 24) : Math.round((sx + tx) / 2 - 22),
          ly: straightY ? midY - 8 : incomingSame.length === 1 ? Math.round((midY + b.y) / 2 - 8) : midY + 4,
        });
      }
    }

    const totalH = curY - layerGap + 16;
    return { width: W, height: totalH, boxes, edgeShapes };
  }

  function renderCausal(focusSelected = false) {
    const graph = CAUSAL.find(g => g.id === state.graph);
    const selId = state.selectedNodeByGraph.get(graph.id) || graph.nodes[0].id;
    state.selectedNodeByGraph.set(graph.id, selId);

    for (const btn of document.querySelectorAll('#causal-picker [data-graph]')) {
      const on = btn.dataset.graph === graph.id;
      btn.setAttribute('aria-selected', String(on));
      btn.setAttribute('aria-pressed', String(on));
    }
    $('causal-summary-text').textContent = graph.summary;

    const mount = $('causal-graph');
    const isDesk = desktopMQ.matches;
    const availW = mount.clientWidth || (isDesk ? (wideDeskMQ.matches ? 512 : 432) : Math.min(560, window.innerWidth - (tabletUpMQ.matches ? 112 : 32)));
    const layout = computeCausalLayout(graph, availW, isDesk);

    const upSet = new Set(graph.edges.filter(e => e.to === selId).map(e => e.from));
    const downSet = new Set(graph.edges.filter(e => e.from === selId).map(e => e.to));

    const makeMarker = (id, fillCls) => s('marker', {
      id,
      viewBox: '0 0 10 10',
      refX: 8,
      refY: 5,
      markerUnits: 'userSpaceOnUse',
      markerWidth: 9,
      markerHeight: 9,
      orient: 'auto-start-reverse',
    }, s('path', { class: fillCls, d: 'M0,1 L9,5 L0,9 Z' }));

    const svgEdges = layout.edgeShapes.map(({ edge, d }) => {
      const hl = edge.from === selId || edge.to === selId;
      const dashed = Boolean(edge.dashed);
      const markerId = dashed ? 'cg-mk-danger' : (hl ? 'cg-mk-hl' : 'cg-mk-std');
      return s('g', {
        class: 'cg-edge-group',
        'data-hl': String(hl),
        'data-dashed': String(dashed),
      }, s('path', {
        class: 'cg-edge-line',
        d,
        'marker-end': `url(#${markerId})`,
      }));
    });

    const svgLayer = s('svg', {
      class: 'cg-svg-layer',
      viewBox: `0 0 ${layout.width} ${layout.height}`,
      'aria-hidden': 'true',
    },
    s('defs', null,
      makeMarker('cg-mk-std', 'cg-arrow-fill'),
      makeMarker('cg-mk-hl', 'cg-arrow-hl-fill'),
      makeMarker('cg-mk-danger', 'cg-arrow-danger-fill')),
    ...svgEdges);

    const edgeLabels = layout.edgeShapes.map(({ edge, lx, ly, vertical }) => {
      const hl = edge.from === selId || edge.to === selId;
      return h('span', {
        class: 'cg-edge-label',
        'data-hl': hl ? 'true' : null,
        'data-dashed': edge.dashed ? 'true' : null,
        'data-vertical': vertical ? 'true' : null,
        style: `left: ${Math.max(2, Math.min(layout.width - 28, lx))}px; top: ${Math.max(0, ly)}px;`,
        'aria-hidden': 'true',
      }, edge.label);
    });

    const nodeById = new Map(graph.nodes.map(n => [n.id, n]));
    const nodeButtons = graph.nodes.map(n => {
      const box = layout.boxes.get(n.id);
      const on = n.id === selId;
      const rel = on ? null : upSet.has(n.id) ? '上游' : downSet.has(n.id) ? '下游' : null;
      const ups = graph.edges.filter(e => e.to === n.id).map(e => nodeById.get(e.from).label);
      const downs = graph.edges.filter(e => e.from === n.id).map(e => nodeById.get(e.to).label);
      const ariaParts = [`${n.label}，${n.sub}`];
      if (ups.length) ariaParts.push(`上游：${ups.join('、')}`);
      if (downs.length) ariaParts.push(`下游：${downs.join('、')}`);

      return h('button', {
        class: 'cg-node',
        'data-node': n.id,
        'data-kind': n.kind || 'mid',
        'data-selected': String(on),
        'aria-pressed': String(on),
        'aria-label': ariaParts.join('。'),
        style: `left: ${box.x}px; top: ${box.y}px; width: ${box.w}px; height: ${box.h}px;`,
        onClick: () => selectNode(n.id, false),
      },
      rel ? h('span', { class: 'rel-tag cg-node-rel' }, rel) : null,
      h('span', { class: 'cg-node-title', 'data-no-rel': rel ? null : 'true' }, n.label),
      h('span', { class: 'cg-node-sub' }, plainText(n.sub)));
    });

    const canvas = h('div', {
      class: 'cg-canvas',
      role: 'group',
      'aria-label': graph.title,
      style: `width: ${layout.width}px; height: ${layout.height}px; margin-inline: auto;`,
    }, svgLayer, ...edgeLabels, ...nodeButtons);

    fill(mount, canvas);

    if (focusSelected) {
      const btn = mount.querySelector(`[data-node="${selId}"]`);
      if (btn) btn.focus({ preventScroll: true });
    }

    const selNode = nodeById.get(selId);
    fill($('causal-detail'), ...buildCausalDetailNodes(graph, selNode, false));
    $('causal-detail').scrollTop = 0;
    renderCausalDock(graph, selNode, nodeById);
  }

  function selectNode(nodeId, focusNode = false) {
    state.selectedNodeByGraph.set(state.graph, nodeId);
    renderCausal(focusNode);
    if (!desktopMQ.matches && !sheetDialog.open) {
      const el = document.querySelector(`#causal-graph [data-node="${nodeId}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: scrollMode() });
    }
  }

  function buildCausalDetailNodes(graph, node, inSheet = false) {
    const nodeById = new Map(graph.nodes.map(n => [n.id, n]));
    const idx = graph.nodes.findIndex(n => n.id === node.id);
    const ups = graph.edges.filter(e => e.to === node.id).map(e => nodeById.get(e.from));
    const downs = graph.edges.filter(e => e.from === node.id).map(e => nodeById.get(e.to));
    const signs = sortSigns(node.signs.map(sid => SIGN.get(sid)).filter(Boolean));
    const signScope = signs.map(x => x.id);

    const navChip = target => h('button', {
      class: 'click-chip',
      onClick: () => {
        selectNode(target.id, false);
        if (inSheet) renderActiveSheet();
      },
    }, target.label);

    const head = h('header', { class: 'detail-head' },
      !inSheet ? h('div', { class: 'detail-head-top' },
        h('div', { style: 'display: flex; align-items: center; gap: 10px;' },
          originBackButton(),
          h('p', { class: 'eyebrow' }, `${graph.short} · 节点 ${idx + 1} / ${graph.nodes.length}`)),
        h('div', { class: 'panel-nav-btns' },
          h('button', {
            class: 'btn-ghost-sm',
            disabled: !ups.length,
            onClick: () => selectNode(ups[0].id, false),
          }, '‹ 上游'),
          h('button', {
            class: 'btn-ghost-sm',
            disabled: !downs.length,
            onClick: () => selectNode(downs[0].id, false),
          }, '下游 ›'))) : null,
      h('h2', { class: 'detail-display' }, node.label),
      h('p', { class: 'detail-sub' }, plainText(node.sub)));

    const kvRow = (label, items) => {
      if (!items || !items.length) return null;
      return h('div', { class: 'meta-kv-row' },
        h('span', { class: 'caption-note' }, label),
        h('div', { class: 'meta-kv-items' }, items));
    };

    return [
      head,
      h('div', { class: 'detail-stack' },
        h('section', { class: 'embed-accent' },
          h('span', { class: 'embed-accent-label' }, '全书机理'),
          h('p', { class: 'embed-accent-body' }, richText(node.mech))),
        h('section', { class: 'embed-secondary' },
          h('span', { class: 'embed-secondary-label' }, '阻断方法'),
          h('p', { class: 'embed-secondary-body' }, richText(node.block))),
        h('div', { class: 'meta-kv-grid' },
          kvRow('原书出处', node.pages.map(pageChip)),
          kvRow('上游', ups.map(navChip)),
          kvRow('下游', downs.map(navChip)),
          kvRow('关联体质', node.constitutions.map(constChip)),
          kvRow('阻断用方', node.remedies.map(remedyChip))),
        signs.length ? h('section', null,
          sectionHeading(`关联舌象 · ${signs.length}`),
          h('div', { class: 'sign-row-grid' }, signs.map(sItem => signRowCard(sItem, signScope)))) : null),
    ];
  }

  function renderCausalDock(graph, node, nodeById) {
    const ups = graph.edges.filter(e => e.to === node.id).map(e => nodeById.get(e.from));
    const downs = graph.edges.filter(e => e.from === node.id).map(e => nodeById.get(e.to));
    const shownConsts = node.constitutions.slice(0, 2);
    const extraConst = node.constitutions.length - shownConsts.length;

    fill($('causal-dock'),
      h('div', {
        class: 'node-dock-row1',
        onClick: e => {
          if (e.target.closest('button')) return;
          openSheet({ type: 'causal-node' }, $('causal-dock'));
        },
      },
      h('div', { class: 'node-dock-titles' },
        h('span', { class: 'node-dock-title' }, node.label),
        h('span', { class: 'node-dock-sub' }, plainText(node.sub))),
      h('button', {
        class: 'node-dock-open-btn',
        onClick: e => openSheet({ type: 'causal-node' }, e.currentTarget),
      }, '看解读 ›')),
      h('div', { class: 'node-dock-row2' },
        h('div', { class: 'node-dock-nav' },
          h('button', {
            class: 'node-dock-step-btn',
            disabled: !ups.length,
            onClick: () => selectNode(ups[0].id, false),
          }, '‹ 上游'),
          h('button', {
            class: 'node-dock-step-btn',
            disabled: !downs.length,
            onClick: () => selectNode(downs[0].id, false),
          }, '下游 ›')),
        shownConsts.length ? h('div', { class: 'node-dock-tones' },
          ...shownConsts.map(constChip),
          extraConst > 0 ? h('span', { class: 'caption-note' }, `+${extraConst}`) : null) : null));
  }

  /* Quiz Module (§5.1 - §5.9) */
  function answerQuiz(q, index) {
    if (state.answers.has(q.id)) return;
    state.answers.set(q.id, index);
    renderQuiz();
    if (!desktopMQ.matches) {
      requestAnimationFrame(() => {
        const fb = document.querySelector('#quiz .quiz-feedback');
        if (fb) fb.scrollIntoView({ block: 'nearest', behavior: scrollMode() });
      });
    }
  }

  function gotoQuiz(index) {
    if (index < 0 || index >= KB.quiz.length) return;
    const pop = $('quiz-grid-pop');
    if (pop && pop.matches(':popover-open')) pop.hidePopover();
    state.quizIndex = index;
    renderQuiz();
    if (desktopMQ.matches) {
      const qPanel = document.querySelector('#quiz .quiz-question-panel');
      if (qPanel) qPanel.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: scrollMode() });
    }
  }

  function requestResetQuiz(triggerEl) {
    if (state.answers.size === 0) return;
    closeCitePopover(false);
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(confirmDialog, triggerEl);
    $('confirm-desc').textContent = `将清空已答 ${state.answers.size} 题的记录，从第 1 题重新开始。`;
    if (!confirmDialog.open) {
      confirmDialog.showModal();
      pushModalHistory('confirm');
    }
  }

  function buildQuizCells() {
    return KB.quiz.map((item, i) => {
      const ans = state.answers.get(item.id);
      const st = ans === undefined ? 'todo' : ans === item.correct_index ? 'right' : 'wrong';
      const cur = i === state.quizIndex;
      const stateLabel = st === 'todo' ? '待作答' : st === 'right' ? '答对' : '答错';
      return h('button', {
        class: 'quiz-cell',
        'data-state': st,
        'aria-current': cur ? 'true' : null,
        'aria-label': `第 ${i + 1} 题，${stateLabel}${cur ? '，当前题' : ''}`,
        onClick: () => gotoQuiz(i),
      },
      String(i + 1),
      st === 'right' ? h('span', { class: 'quiz-cell-mark' }, iconSvg('check', 'icon-xxs')) : null,
      st === 'wrong' ? h('span', { class: 'quiz-cell-mark' }, iconSvg('cross', 'icon-xxs')) : null);
    });
  }

  function buildQuizLegend() {
    return h('div', { class: 'quiz-legend-row' },
      h('span', { class: 'legend-item' }, h('span', { class: 'quiz-swatch' }), '待作答'),
      h('span', { class: 'legend-item' }, h('span', { class: 'quiz-swatch quiz-swatch-right' }), '答对'),
      h('span', { class: 'legend-item' }, h('span', { class: 'quiz-swatch quiz-swatch-wrong' }), '答错'),
      h('span', { class: 'legend-item' }, h('span', { class: 'quiz-swatch quiz-swatch-cur' }), '当前题'));
  }

  function buildQuizSummary(correct, total) {
    const pct = Math.round((correct / total) * 100);
    const wrongItems = KB.quiz
      .map((it, idx) => ({ it, idx }))
      .filter(({ it }) => state.answers.has(it.id) && state.answers.get(it.id) !== it.correct_index);
    const comment = correct === total
      ? '全部答对，已经能把观舌、辨体与调理红线串成一条线。'
      : '点下方错题回看临床情景，再对照原书出处读一遍。';
    return h('section', { class: 'quiz-summary-card' },
      sectionHeading('通关总评'),
      h('div', { style: 'display: flex; align-items: baseline; gap: 10px;' },
        h('span', { class: 'detail-display tabular' }, `${correct} / ${total}`),
        h('span', { style: 'font-size: 15px; color: var(--text-2);' }, `正确率 ${pct}%`)),
      h('p', { style: 'font-size: 14px; line-height: 22px; color: var(--text-2);' }, richText(comment)),
      wrongItems.length ? h('div', { class: 'chip-wrap' }, wrongItems.map(({ idx }) => h('button', {
        class: 'click-chip',
        onClick: () => gotoQuiz(idx),
      }, `第 ${idx + 1} 题`))) : null,
      h('button', {
        class: 'btn btn-primary',
        onClick: e => requestResetQuiz(e.currentTarget),
      }, '重新闯关'));
  }

  function renderQuiz() {
    const total = KB.quiz.length;
    const q = KB.quiz[state.quizIndex];
    const picked = state.answers.get(q.id);
    const done = picked !== undefined;
    const answered = state.answers.size;
    const correct = KB.quiz.filter(item => state.answers.get(item.id) === item.correct_index).length;
    const wrongCount = answered - correct;
    const pct = answered ? Math.round((correct / answered) * 100) : 0;
    const finished = answered === total;

    const quizPop = h('div', { id: 'quiz-grid-pop', class: 'quiz-pop', popover: 'auto', 'aria-label': '题号面板' },
      h('div', { class: 'quiz-grid-4x4' }, buildQuizCells()),
      buildQuizLegend());

    const barBtn = h('button', {
      class: 'quiz-bar-btn',
      'aria-expanded': 'false',
      'aria-controls': 'quiz-grid-pop',
      'aria-label': `第 ${state.quizIndex + 1} 题，共 ${total} 题，答对 ${correct} 题，已答 ${answered} 题，展开题号面板`,
      onClick: () => {
        if (quizPop.matches(':popover-open')) {
          quizPop.hidePopover();
          barBtn.setAttribute('aria-expanded', 'false');
          return;
        }
        quizPop.showPopover();
        barBtn.setAttribute('aria-expanded', 'true');
        const r = barBtn.getBoundingClientRect();
        quizPop.style.top = `${Math.round(r.bottom + 6)}px`;
        quizPop.style.left = `${Math.max(16, Math.round(r.left))}px`;
        quizPop.style.width = `${Math.round(r.width)}px`;
      },
    },
    h('div', { class: 'quiz-bar-top' },
      h('span', { class: 'quiz-bar-title' }, `第 ${state.quizIndex + 1} / ${total} 题`),
      h('span', { class: 'quiz-bar-stats' },
        `答对 ${correct} · 已答 ${answered} · 正确率 ${pct}%`,
        iconSvg('chevron-down', 'icon-xxs'))),
    h('div', { class: 'quiz-seg-strip', 'aria-hidden': 'true' }, KB.quiz.map((it, idx) => {
      const a = state.answers.get(it.id);
      const st = a === undefined ? 'todo' : a === it.correct_index ? 'right' : 'wrong';
      return h('span', {
        class: 'quiz-seg-dot',
        'data-state': st,
        'data-current': idx === state.quizIndex ? 'true' : null,
      });
    })));

    quizPop.addEventListener('toggle', e => {
      barBtn.setAttribute('aria-expanded', String(e.newState === 'open'));
    });

    const boardDesktop = h('aside', { class: 'quiz-board-desktop' },
      sectionHeading('闯关进度'),
      h('div', { class: 'quiz-score-line' },
        h('div', { style: 'display: flex; align-items: baseline; gap: 6px;' },
          h('span', { class: 'quiz-score-big', 'data-positive': correct >= 1 ? 'true' : null }, String(correct)),
          h('span', { style: 'font-size: 15px; color: var(--text-2);' }, `/ ${total} 答对`)),
        h('span', { class: 'caption-note' }, `已答 ${answered} 题 · 正确率 ${pct}%`)),
      h('div', { class: 'quiz-dual-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(answered) },
        h('span', { class: 'quiz-dual-right', style: `width: ${(correct / total) * 100}%;` }),
        h('span', { class: 'quiz-dual-wrong', style: `width: ${(wrongCount / total) * 100}%;` })),
      h('div', { class: 'quiz-grid-4x4', style: 'margin-top: 8px;' }, buildQuizCells()),
      buildQuizLegend(),
      finished ? buildQuizSummary(correct, total) : null,
      h('button', {
        class: 'btn btn-ghost quiz-board-reset',
        disabled: answered === 0,
        onClick: e => requestResetQuiz(e.currentTarget),
      }, '重新闯关'));

    const feedbackNode = done ? h('div', {
      class: 'quiz-feedback',
      role: 'status',
      'aria-live': 'polite',
      'data-correct': String(picked === q.correct_index),
    },
    h('div', { class: 'quiz-feedback-head' },
      h('strong', { class: 'quiz-verdict' },
        iconSvg(picked === q.correct_index ? 'check-circle' : 'cross-circle', 'icon-sm'),
        picked === q.correct_index ? '回答正确' : '答错了'),
      picked === q.correct_index
        ? h('span', { class: 'quiz-choice-note' }, '你选 ', h('span', { class: 'quiz-choice-ok' }, LETTERS[picked]))
        : h('span', { class: 'quiz-choice-note' }, `你选 ${LETTERS[picked]} · 正确答案 `, h('span', { class: 'quiz-choice-ok' }, LETTERS[q.correct_index]))),
    h('p', { class: 'quiz-explain-body' }, richText(q.explanation)),
    h('div', { style: 'display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px;' },
      h('span', { class: 'caption-note' }, '出处与关联'),
      pageChip(q.page),
      ...q.related_constitution_ids.map(constChip))) : null;

    const questionPanel = h('article', { class: 'quiz-question-panel' },
      !desktopMQ.matches && finished ? buildQuizSummary(correct, total) : null,
      h('p', { class: 'eyebrow only-desktop' }, `第 ${state.quizIndex + 1} / ${total} 题 · 临床情景`),
      h('blockquote', { class: 'embed-accent' },
        h('p', { class: 'embed-accent-body' }, richText(q.scenario))),
      h('h3', { class: 'quiz-question-title' }, q.question),
      h('div', { class: 'quiz-options' }, q.options.map((optTxt, i) => {
        const res = !done ? null : i === q.correct_index ? 'correct' : i === picked ? 'wrong' : 'dimmed';
        const ariaSuffix = !done ? '' : `${i === q.correct_index ? '，正确答案' : ''}${i === picked ? '，你的选择' : ''}`;
        return h('button', {
          class: 'quiz-opt',
          'data-result': res,
          disabled: done,
          'aria-label': `${LETTERS[i]}：${plainText(optTxt)}${ariaSuffix}`,
          onClick: () => answerQuiz(q, i),
        },
        h('span', { class: 'quiz-opt-letter' }, LETTERS[i]),
        h('span', { class: 'quiz-opt-text' }, plainText(optTxt)),
        res === 'correct' ? h('span', { class: 'quiz-opt-icon' }, iconSvg('check', 'icon-sm')) : null,
        res === 'wrong' ? h('span', { class: 'quiz-opt-icon' }, iconSvg('cross', 'icon-sm')) : null);
      })),
      feedbackNode,
      h('div', { class: 'quiz-actions-desktop only-desktop' },
        h('button', {
          class: 'btn btn-ghost',
          disabled: state.quizIndex === 0,
          onClick: () => gotoQuiz(state.quizIndex - 1),
        }, '‹ 上一题'),
        h('button', {
          class: done ? 'btn btn-primary' : 'btn btn-ghost',
          disabled: state.quizIndex >= total - 1,
          onClick: () => gotoQuiz(state.quizIndex + 1),
        }, '下一题 ›')));

    const mobileActions = h('footer', { class: 'bottom-dock quiz-actions-mobile' },
      h('button', {
        class: 'btn btn-ghost',
        disabled: state.quizIndex === 0,
        onClick: () => gotoQuiz(state.quizIndex - 1),
      }, '‹ 上一题'),
      h('button', {
        class: 'text-link-btn quiz-reset-link',
        disabled: answered === 0,
        onClick: e => requestResetQuiz(e.currentTarget),
      }, '重新闯关'),
      h('button', {
        class: done ? 'btn btn-primary' : 'btn btn-ghost',
        disabled: state.quizIndex >= total - 1,
        onClick: () => gotoQuiz(state.quizIndex + 1),
      }, '下一题 ›'));

    fill($('quiz'),
      h('div', { class: 'quiz-layout' },
        h('div', { class: 'quiz-bar-sticky' }, barBtn, quizPop),
        boardDesktop,
        questionPanel),
      mobileActions);
  }

  /* =========================================================
     16. GLOBAL SEARCH (⌘K / Ctrl K, §2.7 & §9.7)
     ========================================================= */
  function makeSearchEntry(type, id, title, metaLine, texts, extra = {}) {
    const cleanTitle = plainText(title);
    const cleanMeta = plainText(metaLine);
    const body = texts.map(plainText).join(' ');
    return {
      type,
      id,
      title: cleanTitle,
      metaLine: cleanMeta,
      body,
      hay: `${cleanTitle} ${cleanMeta} ${body}`.toLowerCase(),
      titleLc: cleanTitle.toLowerCase(),
      subLc: cleanMeta.toLowerCase(),
      ...extra,
    };
  }

  const SEARCH_INDEX = [
    ...KB.chapters.map(c => makeSearchEntry(
      'chapter',
      c.id,
      c.title,
      `第${CN[c.chapter_num]}章 · P.${c.page_start}–${c.page_end}`,
      [c.subtitle, c.core_thesis, ...c.chain_of_thought, ...c.key_takeaways],
      { chapterNum: c.chapter_num },
    )),
    ...KB.constitutions.map(c => makeSearchEntry(
      'constitution',
      c.id,
      c.name,
      `第${CN[CHAPTER.get(c.chapter_id).chapter_num]}章 · P.${c.page_start}–${c.page_end}`,
      [c.alias, ...c.root_causes, ...c.body_symptoms, ...c.child_symptoms, ...c.core_tongue_features, ...c.differentiation_notes, ...c.lifestyle_taboos, ...c.conditioning_principles],
      { toneId: c.id },
    )),
    ...KB.tongue_signs.map(sign => makeSearchEntry(
      'sign',
      sign.id,
      sign.title,
      `${RISK_LABEL[sign.risk_level]} · P.${sign.page}`,
      [...sign.alert_tags, sign.visual_features, sign.clinical_meaning, sign.differential_tip, sign.action_principle],
      { figId: sign.fig_id },
    )),
    ...KB.remedies.map(r => makeSearchEntry(
      'remedy',
      r.id,
      r.name,
      `${METHOD_LABEL[r.method_type]} · P.${r.page}`,
      [...r.indications, r.ingredients.map(ing => `${ing.name}${ing.amount}`).join('、'), r.preparation_and_usage, ...r.modifications, ...r.contraindications, r.mechanism],
      { methodType: r.method_type },
    )),
    ...[...HERBS].map(([name, remedies]) => makeSearchEntry(
      'herb',
      name,
      name,
      `见于 ${remedies.length} 种方法`,
      remedies.map(r => r.name),
    )),
  ];

  function searchSnippet(entry, terms) {
    const lower = entry.body.toLowerCase();
    const at = Math.min(...terms.map(t => lower.indexOf(t)).filter(i => i >= 0));
    if (!Number.isFinite(at) || entry.titleLc.includes(terms[0])) return entry.metaLine;
    const start = Math.max(0, at - 14);
    const slice = entry.body.slice(start, start + 54);
    return `${entry.metaLine} · ${start ? '…' : ''}${slice}${start + 54 < entry.body.length ? '…' : ''}`;
  }

  function buildSearchMarker(entry) {
    if (entry.type === 'chapter') {
      return h('span', { class: 'seq-ring' }, CN[entry.chapterNum]);
    }
    if (entry.type === 'constitution') {
      return constSeal(entry.toneId, 'xs');
    }
    if (entry.type === 'sign') {
      if (entry.figId && !state.failedFigs.has(entry.figId)) {
        return h('span', { class: 'search-hit-thumb img-stage' }, figImg(entry.figId, { alt: entry.title }));
      }
      return h('span', { class: 'search-hit-marker', style: 'color: var(--text-3);' }, iconSvg('doc', 'icon-sm'));
    }
    if (entry.type === 'remedy') {
      return h('span', { class: 'search-hit-marker' }, methodSeal(entry.methodType, 'sm'));
    }
    return h('span', { class: 'search-hit-marker', style: 'color: var(--secondary);' }, iconSvg('herb', 'icon-sm'));
  }

  function openSearch(triggerEl = document.activeElement) {
    closeCitePopover(false);
    if (triggerEl instanceof HTMLElement) dialogReturnFocus.set(searchDialog, triggerEl);
    if (!searchDialog.open) {
      searchDialog.showModal();
      pushModalHistory('search');
    }
    const input = $('search-input');
    input.focus();
    input.select();
    renderSearch(input.value, false);
  }

  function renderSearch(raw, resetCat = true) {
    const trimmed = raw.trim();
    $('search-clear').hidden = !raw.length;
    if (resetCat) state.searchCat = 'all';

    const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    const catsBox = $('search-cats');
    const resultsBox = $('search-results');
    state.hitIndex = 0;
    state.hits = [];

    if (!terms.length) {
      catsBox.hidden = true;
      fill(catsBox);
      $('search-input').removeAttribute('aria-activedescendant');
      fill(resultsBox, h('div', { class: 'empty-state' },
        h('p', { class: 'empty-state-sub' }, '输入关键词，搜索章节、体质、舌象、方法、药材'),
        h('div', { class: 'chip-wrap', style: 'justify-content: center;' },
          SEARCH_SUGGESTIONS.map(word => h('button', {
            class: 'click-chip',
            onClick: () => {
              $('search-input').value = word;
              renderSearch(word, true);
              $('search-input').focus();
            },
          }, word)))));
      return;
    }

    const scored = SEARCH_INDEX
      .filter(entry => terms.every(t => entry.hay.includes(t)))
      .map(entry => ({
        entry,
        score: terms.reduce((sum, t) => sum + (entry.titleLc === t ? 60 : entry.titleLc.includes(t) ? 24 : entry.subLc.includes(t) ? 6 : 1), 0),
      }));

    if (!scored.length) {
      catsBox.hidden = true;
      fill(catsBox);
      $('search-input').removeAttribute('aria-activedescendant');
      fill(resultsBox, h('div', { class: 'empty-state' },
        h('p', { class: 'empty-state-title' }, `没有找到“${trimmed}”`),
        h('p', { class: 'empty-state-sub' }, '试试体质名、舌象特征或药材名')));
      return;
    }

    const allGroups = Object.keys(TYPE_LABEL).map(type => {
      const items = scored.filter(x => x.entry.type === type).sort((a, b) => b.score - a.score);
      return { type, items, best: items[0]?.score ?? 0 };
    }).filter(g => g.items.length > 0).sort((a, b) => b.best - a.best);

    if (state.searchCat !== 'all' && !allGroups.some(g => g.type === state.searchCat)) {
      state.searchCat = 'all';
    }

    catsBox.hidden = false;
    const catChips = [
      h('button', {
        class: 'sub-filter-chip',
        role: 'tab',
        'aria-selected': String(state.searchCat === 'all'),
        onClick: () => {
          state.searchCat = 'all';
          renderSearch(raw, false);
          resultsBox.scrollTop = 0;
        },
      }, `全部 ${scored.length}`),
      ...allGroups.map(g => h('button', {
        class: 'sub-filter-chip',
        role: 'tab',
        'aria-selected': String(state.searchCat === g.type),
        onClick: () => {
          state.searchCat = g.type;
          renderSearch(raw, false);
          resultsBox.scrollTop = 0;
        },
      }, `${TYPE_LABEL[g.type]} ${g.items.length}`)),
    ];
    fill(catsBox, ...catChips);

    const visibleGroups = state.searchCat === 'all'
      ? allGroups
      : allGroups.filter(g => g.type === state.searchCat);

    let k = 0;
    const groupNodes = visibleGroups.map(g => h('section', null,
      h('div', { class: 'search-group-head' },
        h('h3', { class: 'group-label' }, TYPE_LABEL[g.type]),
        h('span', { class: 'caption-note' }, String(g.items.length))),
      g.items.map(({ entry }) => {
        const hitIdx = k++;
        state.hits.push(entry);
        return h('button', {
          class: 'search-hit',
          id: `search-hit-${hitIdx}`,
          role: 'option',
          'data-hit': String(hitIdx),
          'aria-selected': 'false',
          onClick: () => activateSearchHit(hitIdx),
          onPointermove: () => {
            if (state.hitIndex === hitIdx) return;
            state.hitIndex = hitIdx;
            syncSearchHit(false);
          },
        },
        buildSearchMarker(entry),
        h('span', { class: 'search-hit-main' },
          h('span', { class: 'search-hit-title' }, mark(entry.title, terms)),
          h('span', { class: 'search-hit-sub' }, mark(searchSnippet(entry, terms), terms))));
      })));

    fill(resultsBox, ...groupNodes);
    syncSearchHit(false);
  }

  function syncSearchHit(scroll = true) {
    let activeId = '';
    for (const el of document.querySelectorAll('#search-results [data-hit]')) {
      const on = Number(el.dataset.hit) === state.hitIndex;
      el.setAttribute('aria-selected', String(on));
      if (on) {
        activeId = el.id;
        if (scroll) el.scrollIntoView({ block: 'nearest' });
      }
    }
    if (activeId) $('search-input').setAttribute('aria-activedescendant', activeId);
    else $('search-input').removeAttribute('aria-activedescendant');
  }

  function activateSearchHit(k) {
    const entry = state.hits[k];
    if (!entry) return;
    searchDialog.close();
    if (entry.type === 'chapter') jumpToChapter(entry.id, false);
    else if (entry.type === 'constitution') jumpToConstitution(entry.id, false);
    else if (entry.type === 'sign') jumpToSign(entry.id);
    else if (entry.type === 'remedy') jumpToRemedy(entry.id, false);
    else if (entry.type === 'herb') jumpToHerb(entry.id);
  }

  /* =========================================================
     17. EVENT WIRING & INITIALIZATION
     ========================================================= */
  function renderChrome() {
    const { meta } = KB;
    $('brand-sub').textContent = `${meta.author}《${meta.title}》`;
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    $('search-kbd').textContent = isMac ? '⌘K' : 'Ctrl K';
  }

  function wireSheetSwipeClose() {
    const handleZone = $('sheet-handle-zone');
    const headZone = $('sheet-head');
    const frame = $('sheet-frame');
    let startY = 0;
    let startT = 0;
    let dragging = false;

    const onStart = e => {
      if (tabletUpMQ.matches || e.target.closest('button, a')) return;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      startT = performance.now();
      dragging = true;
      frame.style.transition = 'none';
    };

    const onMove = e => {
      if (!dragging) return;
      const curY = e.touches ? e.touches[0].clientY : e.clientY;
      const dy = Math.max(0, curY - startY);
      frame.style.transform = `translateY(${dy}px)`;
    };

    const onEnd = e => {
      if (!dragging) return;
      dragging = false;
      const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const dy = Math.max(0, endY - startY);
      const dt = Math.max(1, performance.now() - startT);
      frame.style.transition = '';
      frame.style.transform = '';
      if (dy > 96 || dy / dt > 0.5) {
        sheetDialog.close();
      }
    };

    for (const el of [handleZone, headZone]) {
      el.addEventListener('touchstart', onStart, { passive: true });
      el.addEventListener('touchmove', onMove, { passive: true });
      el.addEventListener('touchend', onEnd);
    }
  }

  function wireEvents() {
    /* Main navigation tabs */
    for (const tab of navTabs) {
      tab.addEventListener('click', () => {
        clearOriginIfActive();
        selectTab(tab.dataset.tab, false);
      });
    }
    $('app-nav').addEventListener('keydown', e => {
      const i = navTabs.indexOf(e.target);
      if (i === -1) return;
      const prevKeys = ['ArrowLeft', 'ArrowUp'];
      const nextKeys = ['ArrowRight', 'ArrowDown'];
      if (!prevKeys.includes(e.key) && !nextKeys.includes(e.key)) return;
      e.preventDefault();
      clearOriginIfActive();
      const delta = nextKeys.includes(e.key) ? 1 : -1;
      const next = navTabs[(i + delta + navTabs.length) % navTabs.length];
      next.focus();
      selectTab(next.dataset.tab, false);
    });

    /* Overview segment control */
    for (const btn of document.querySelectorAll('#overview-seg [data-ov-seg]')) {
      btn.addEventListener('click', () => {
        state.ovSeg = btn.dataset.ovSeg;
        syncOverviewSeg();
      });
    }
    $('overview-seg').addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      state.ovSeg = state.ovSeg === 'chapters' ? 'constitutions' : 'chapters';
      syncOverviewSeg();
      document.querySelector(`#overview-seg [data-ov-seg="${state.ovSeg}"]`)?.focus();
    });

    /* Zone mode switch & scroll hint */
    for (const btn of document.querySelectorAll('#zone-mode [data-mode]')) {
      btn.addEventListener('click', () => {
        state.zoneMode = btn.dataset.mode;
        syncZoneMode();
      });
    }
    $('zone-mode').addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      state.zoneMode = state.zoneMode === 'map' ? 'book' : 'map';
      syncZoneMode();
      document.querySelector(`#zone-mode [data-mode="${state.zoneMode}"]`)?.focus();
    });
    $('zone-detail').addEventListener('scroll', updateZoneScrollHint, { passive: true });

    /* Wizard gate & rail modals + dock swipe up */
    $('gate').addEventListener('click', e => openGateModal(e.currentTarget));
    $('gate-clear-btn').addEventListener('click', () => {
      state.gateConfirmed = true;
      state.prechecks.clear();
      renderGate();
      renderReadout();
      renderWizardDock();
    });
    $('gate-done-btn').addEventListener('click', () => {
      state.gateConfirmed = true;
      renderGateStatus();
      renderReadout({ preserveScroll: true });
      if (sheetDialog.open && state.sheetCtx?.type === 'wizard-readout') {
        renderActiveSheet({ preserveScroll: true });
      }
    });
    $('rail-open-desktop').addEventListener('click', e => openRailModal(e.currentTarget));

    $('wizard-rail').addEventListener('click', e => {
      const node = e.target.closest('.rail-node');
      if (node && node.dataset.state !== 'locked') {
        state.step = node.dataset.step;
        chooseOption(node.dataset.step, node.dataset.option, false);
        railDialog.close();
        return;
      }
      const head = e.target.closest('.rail-head');
      if (head && reachable(stepIndex(head.dataset.step))) {
        goStep(head.dataset.step);
        railDialog.close();
      }
    });
    $('wizard-rail').addEventListener('keydown', e => {
      if (!isActivationKey(e)) return;
      const node = e.target.closest('.rail-node');
      if (node && node.dataset.state !== 'locked') {
        e.preventDefault();
        state.step = node.dataset.step;
        chooseOption(node.dataset.step, node.dataset.option, false);
        railDialog.close();
        return;
      }
      const head = e.target.closest('.rail-head');
      if (head && reachable(stepIndex(head.dataset.step))) {
        e.preventDefault();
        goStep(head.dataset.step);
        railDialog.close();
      }
    });

    let dockTouchStartY = 0;
    $('wizard-dock').addEventListener('touchstart', e => {
      dockTouchStartY = e.touches[0].clientY;
    }, { passive: true });
    $('wizard-dock').addEventListener('touchend', e => {
      const dy = dockTouchStartY - e.changedTouches[0].clientY;
      if (dy > 24) openSheet({ type: 'wizard-readout' }, $('wizard-dock'));
    });

    /* Atlas segment control & Compare prev/next buttons */
    for (const btn of document.querySelectorAll('#atlas-seg [data-atlas-seg]')) {
      btn.addEventListener('click', () => {
        state.atlasSeg = btn.dataset.atlasSeg;
        syncAtlasSeg();
      });
    }
    $('atlas-seg').addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      state.atlasSeg = state.atlasSeg === 'signs' ? 'compare' : 'signs';
      syncAtlasSeg();
      document.querySelector(`#atlas-seg [data-atlas-seg="${state.atlasSeg}"]`)?.focus();
    });

    $('cmp-prev-btn').addEventListener('click', () => {
      const idx = KB.compare_pairs.findIndex(p => p.id === state.pair);
      if (idx > 0) {
        state.pair = KB.compare_pairs[idx - 1].id;
        renderCompare();
      }
    });
    $('cmp-next-btn').addEventListener('click', () => {
      const idx = KB.compare_pairs.findIndex(p => p.id === state.pair);
      if (idx < KB.compare_pairs.length - 1) {
        state.pair = KB.compare_pairs[idx + 1].id;
        renderCompare();
      }
    });

    /* Remedies inline reset */
    $('remedy-reset-inline').addEventListener('click', () => {
      state.remedy = { ...REMEDY_DEFAULT };
      onRemedyFilterChange();
      $('remedy-keyword')?.focus();
    });

    /* Mastery ViewSwitch */
    for (const btn of document.querySelectorAll('#mastery-view-switch [data-mastery-view]')) {
      btn.addEventListener('click', () => setMasteryView(btn.dataset.masteryView));
    }
    $('mastery-view-switch').addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      setMasteryView(state.masteryView === 'causal' ? 'quiz' : 'causal');
      document.querySelector(`#mastery-view-switch [data-mastery-view="${state.masteryView}"]`)?.focus();
    });

    /* Quiz reset confirm */
    $('confirm-ok-btn').addEventListener('click', () => {
      state.answers.clear();
      state.quizIndex = 0;
      confirmDialog.close();
      renderQuiz();
    });

    /* Search modal */
    $('search-open').addEventListener('click', e => openSearch(e.currentTarget));
    $('search-input').addEventListener('input', e => renderSearch(e.currentTarget.value, true));
    $('search-clear').addEventListener('click', () => {
      $('search-input').value = '';
      renderSearch('', true);
      $('search-input').focus();
    });
    $('search-input').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!state.hits.length) return;
        state.hitIndex = (state.hitIndex + (e.key === 'ArrowDown' ? 1 : -1) + state.hits.length) % state.hits.length;
        syncSearchHit(true);
      } else if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        activateSearchHit(state.hitIndex);
      }
    });
    $('search-cats').addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const chips = [...document.querySelectorAll('#search-cats button')];
      const idx = chips.indexOf(e.target);
      if (idx === -1) return;
      e.preventDefault();
      const nextIdx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length;
      const next = chips[nextIdx];
      next.click();
      document.querySelectorAll('#search-cats button')[nextIdx]?.focus();
    });

    /* Dialog close buttons & backdrop click + focus return */
    for (const btn of document.querySelectorAll('[data-close-dialog]')) {
      btn.addEventListener('click', () => btn.closest('dialog')?.close());
    }
    for (const dlg of document.querySelectorAll('dialog')) {
      dlg.addEventListener('click', e => {
        if (e.target === dlg) dlg.close();
      });
      dlg.addEventListener('close', () => {
        if (dlg.open) return;
        closeCitePopover(false);
        const remDlgs = [...document.querySelectorAll('dialog[open]')];
        const nextHost = remDlgs.length ? remDlgs.at(-1) : document.body;
        if (citePop.parentElement !== nextHost) nextHost.appendChild(citePop);
        if (dlg === gateDialog) $('gate').setAttribute('aria-expanded', 'false');
        if (dlg === sheetDialog) {
          state.sheetCtx = null;
          syncListSelectionMarks();
        }
        const retEl = dialogReturnFocus.get(dlg);
        dialogReturnFocus.delete(dlg);
        if (!remDlgs.length && retEl && retEl.isConnected && !retEl.closest('dialog:not([open])')) {
          retEl.focus({ preventScroll: true });
        }
      });
    }

    wireSheetSwipeClose();

    /* Popstate: close top-most dialog or return to origin */
    window.addEventListener('popstate', () => {
      const openDlgs = [...document.querySelectorAll('dialog[open]')];
      if (openDlgs.length) {
        openDlgs.at(-1).close();
      } else if (state.origin) {
        backToOrigin();
      }
    });

    /* Global keyboard shortcuts: Cmd/Ctrl+K, Esc for cite popover, Left/Right in SignDialog & Lightbox, '/' in Remedies */
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
        return;
      }
      if (e.key === 'Escape' && citePop.matches(':popover-open')) {
        e.preventDefault();
        e.stopPropagation();
        closeCitePopover(true);
        return;
      }
      if (signDialog.open && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        stepSignModal(e.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (lightboxDialog.open && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        stepLightbox(e.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (state.tab === 'remedies' && e.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        $('remedy-keyword')?.focus();
      }
    });

    /* Inline Citation (.cite-ref) delegated hover / focus / click / keyboard / outside-pointer / scroll */
    document.addEventListener('pointerover', e => {
      if (!hoverMQ.matches) return;
      const ref = e.target.closest('.cite-ref');
      const inPop = e.target.closest('#cite-popover');
      if (ref) {
        if (citeLeaveTimer) {
          clearTimeout(citeLeaveTimer);
          citeLeaveTimer = 0;
        }
        if (activeCiteEl === ref) return;
        if (citePinned) {
          openCitePopover(ref, { pinned: false, pointerEvent: e });
          return;
        }
        clearCiteTimers();
        citeHoverTimer = setTimeout(() => {
          openCitePopover(ref, { pinned: false, pointerEvent: e });
        }, 120);
      } else if (inPop && citeLeaveTimer) {
        clearTimeout(citeLeaveTimer);
        citeLeaveTimer = 0;
      }
    });

    document.addEventListener('pointerout', e => {
      if (!hoverMQ.matches || citePinned || !activeCiteEl) return;
      const fromCiteOrPop = e.target.closest('.cite-ref, #cite-popover');
      if (!fromCiteOrPop) return;
      const toCiteOrPop = e.relatedTarget instanceof Element ? e.relatedTarget.closest('.cite-ref, #cite-popover') : null;
      if (toCiteOrPop) return;
      clearCiteTimers();
      citeLeaveTimer = setTimeout(() => {
        if (!citePinned) closeCitePopover(false);
      }, 160);
    });

    document.addEventListener('focusin', e => {
      const ref = e.target.closest('.cite-ref');
      if (ref && activeCiteEl !== ref) {
        openCitePopover(ref, { pinned: false });
      }
    });

    document.addEventListener('focusout', e => {
      if (citePinned || !activeCiteEl) return;
      const nextEl = e.relatedTarget;
      if (nextEl instanceof Element && (nextEl.closest('#cite-popover') || nextEl === activeCiteEl)) return;
      closeCitePopover(false);
    });

    document.addEventListener('click', e => {
      const ref = e.target.closest('.cite-ref');
      if (!ref) return;
      e.stopPropagation();
      if (activeCiteEl === ref && citePinned && citePop.matches(':popover-open')) {
        closeCitePopover(false);
      } else {
        openCitePopover(ref, { pinned: true, pointerEvent: e, focusInside: false });
      }
    });

    document.addEventListener('keydown', e => {
      const ref = e.target instanceof Element ? e.target.closest('.cite-ref') : null;
      if (!ref || !isActivationKey(e)) return;
      e.preventDefault();
      e.stopPropagation();
      if (activeCiteEl === ref && citePinned && citePop.matches(':popover-open')) {
        closeCitePopover(true);
      } else {
        openCitePopover(ref, { pinned: true, focusInside: true });
      }
    });

    document.addEventListener('pointerdown', e => {
      if (!citePop.matches(':popover-open')) return;
      if (e.target.closest('.cite-ref, #cite-popover')) return;
      closeCitePopover(false);
    });

    /* Scroll & Resize listeners */
    window.addEventListener('scroll', e => {
      if (citePop.matches(':popover-open')) closeCitePopover(false);
      if (e.target === document || e.target === document.documentElement) {
        $('topbar').dataset.scrolled = String(window.scrollY > 2);
        const os = document.querySelector('.overview-seg-wrap');
        if (os && state.tab === 'overview') os.dataset.stuck = String(os.getBoundingClientRect().top <= 58);
        const zb = $('zone-bar-wrap');
        if (zb && state.tab === 'zones') zb.dataset.stuck = String(zb.getBoundingClientRect().top <= 58);
        if (state.tab === 'zones') updateZoneScrollHint();
        const af = $('atlas-filter-sticky');
        if (af && state.tab === 'atlas' && state.atlasSeg === 'signs' && !desktopMQ.matches) af.dataset.stuck = String(af.getBoundingClientRect().top <= 58);
        const rf = $('remedy-filters');
        if (rf && state.tab === 'remedies') rf.dataset.stuck = String(rf.getBoundingClientRect().top <= 58);
        const ms = $('mastery-switch-sticky');
        if (ms && state.tab === 'mastery') ms.dataset.stuck = String(!desktopMQ.matches && ms.getBoundingClientRect().top <= 58);
      }
    }, { capture: true, passive: true });

    let lastIsTabletUp = tabletUpMQ.matches;
    let lastIsDesktop = desktopMQ.matches;
    let lastIsWideDesk = wideDeskMQ.matches;

    window.addEventListener('resize', () => {
      if (citePop.matches(':popover-open')) closeCitePopover(false);
      const curTabletUp = tabletUpMQ.matches;
      const curDesktop = desktopMQ.matches;
      const curWideDesk = wideDeskMQ.matches;

      if (curTabletUp !== lastIsTabletUp) {
        lastIsTabletUp = curTabletUp;
        buildZoneMap();
        syncAtlas(false);
        if (sheetDialog.open && state.sheetCtx?.type === 'wizard-readout') {
          renderActiveSheet();
        }
        if (signDialog.open) renderSignDialog();
      }
      if (curDesktop !== lastIsDesktop || curWideDesk !== lastIsWideDesk) {
        if (curDesktop && sheetDialog.open) {
          sheetDialog.close();
        }
        if (!curDesktop && lastIsDesktop) {
          state.ovSeg = state.inspect.kind === 'constitution' ? 'constitutions' : 'chapters';
          syncOverviewSeg();
        }
        lastIsDesktop = curDesktop;
        lastIsWideDesk = curWideDesk;
        renderInspector();
        renderZoneDetail();
        renderGate();
        renderWizard();
        syncAtlas(false);
        syncRemedyFilters();
        renderRemedyDetailPanel();
        renderQuiz();
        syncListSelectionMarks();
      }
      if (state.tab === 'mastery' && state.masteryView === 'causal') {
        renderCausal(false);
      }
      updateZoneScrollHint();
      syncOverviewAsideSticky();
      syncRemedyAsideSticky();
      syncAtlasSeg();
    });

    document.addEventListener('animationend', e => {
      if (e.animationName === 'remedy-flash') {
        e.target.removeAttribute('data-flash');
      }
    });
  }

  /* =========================================================
     18. BOOTSTRAP
     ========================================================= */
  renderChrome();
  syncOverviewSeg();
  renderChapterTree();
  renderConstGrid();
  renderInspector();
  buildZoneMap();
  syncZoneMode();
  selectZone(state.zone, false);
  renderGate();
  renderWizard();
  buildAtlasFilters();
  syncAtlasSeg();
  syncAtlas(false);
  buildComparePicker();
  renderCompare();
  buildRemedyFilters();
  syncRemedyFilters();
  renderRemedyGrid();
  renderRemedyDetailPanel();
  buildCausalPicker();
  renderCausal(false);
  renderQuiz();
  syncListSelectionMarks();
  wireEvents();
})();
