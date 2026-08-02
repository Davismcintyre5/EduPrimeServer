const constituencies = {
  '001': [ // Mombasa
    { code: '001', name: 'Changamwe' }, { code: '002', name: 'Jomvu' }, 
    { code: '003', name: 'Kisauni' }, { code: '004', name: 'Nyali' }, 
    { code: '005', name: 'Likoni' }, { code: '006', name: 'Mvita' }
  ],
  '002': [ // Kwale
    { code: '007', name: 'Msambweni' }, { code: '008', name: 'Lungalunga' }, 
    { code: '009', name: 'Matuga' }, { code: '010', name: 'Kinango' }
  ],
  '003': [ // Kilifi
    { code: '011', name: 'Kilifi North' }, { code: '012', name: 'Kilifi South' }, 
    { code: '013', name: 'Kaloleni' }, { code: '014', name: 'Rabai' }, 
    { code: '015', name: 'Ganze' }, { code: '016', name: 'Malindi' }, 
    { code: '017', name: 'Magarini' }
  ],
  '004': [ // Tana River
    { code: '018', name: 'Garsen' }, { code: '019', name: 'Galole' }, 
    { code: '020', name: 'Bura' }
  ],
  '005': [ // Lamu
    { code: '021', name: 'Lamu East' }, { code: '022', name: 'Lamu West' }
  ],
  '006': [ // Taita Taveta
    { code: '023', name: 'Taveta' }, { code: '024', name: 'Wundanyi' }, 
    { code: '025', name: 'Mwatate' }, { code: '026', name: 'Voi' }
  ],
  '007': [ // Garissa
    { code: '027', name: 'Garissa Township' }, { code: '028', name: 'Balambala' }, 
    { code: '029', name: 'Lagdera' }, { code: '030', name: 'Dadaab' }, 
    { code: '031', name: 'Fafi' }, { code: '032', name: 'Ijara' }
  ],
  '008': [ // Wajir
    { code: '033', name: 'Wajir North' }, { code: '034', name: 'Wajir East' }, 
    { code: '035', name: 'Tarbaj' }, { code: '036', name: 'Wajir West' }, 
    { code: '037', name: 'Eldas' }, { code: '038', name: 'Wajir South' }
  ],
  '009': [ // Mandera
    { code: '039', name: 'Mandera West' }, { code: '040', name: 'Banissa' }, 
    { code: '041', name: 'Mandera North' }, { code: '042', name: 'Mandera South' }, 
    { code: '043', name: 'Mandera East' }, { code: '044', name: 'Lafey' }
  ],
  '010': [ // Marsabit
    { code: '045', name: 'Moyale' }, { code: '046', name: 'North Horr' }, 
    { code: '047', name: 'Saku' }, { code: '048', name: 'Laisamis' }
  ],
  '011': [ // Isiolo
    { code: '049', name: 'Isiolo North' }, { code: '050', name: 'Isiolo South' }
  ],
  '012': [ // Meru
    { code: '051', name: 'Igembe South' }, { code: '052', name: 'Igembe Central' }, 
    { code: '053', name: 'Igembe North' }, { code: '054', name: 'Tigania West' }, 
    { code: '055', name: 'Tigania East' }, { code: '056', name: 'North Imenti' }, 
    { code: '057', name: 'Buuri' }, { code: '058', name: 'Central Imenti' }, 
    { code: '059', name: 'South Imenti' }
  ],
  '013': [ // Tharaka Nithi
    { code: '060', name: 'Maara' }, { code: '061', name: 'Chuka/Igambang\'ombe' }, 
    { code: '062', name: 'Tharaka' }
  ],
  '014': [ // Embu
    { code: '063', name: 'Manyatta' }, { code: '064', name: 'Runyenjes' }, 
    { code: '065', name: 'Mbeere South' }, { code: '066', name: 'Mbeere North' }
  ],
  '015': [ // Kitui
    { code: '067', name: 'Mwingi North' }, { code: '068', name: 'Mwingi West' }, 
    { code: '069', name: 'Mwingi Central' }, { code: '070', name: 'Kitui West' }, 
    { code: '071', name: 'Kitui Rural' }, { code: '072', name: 'Kitui Central' }, 
    { code: '073', name: 'Kitui East' }, { code: '074', name: 'Kitui South' }
  ],
  '016': [ // Machakos
    { code: '075', name: 'Masinga' }, { code: '076', name: 'Yatta' }, 
    { code: '077', name: 'Kangundo' }, { code: '078', name: 'Matungulu' }, 
    { code: '079', name: 'Kathiani' }, { code: '080', name: 'Mavoko' }, 
    { code: '081', name: 'Machakos Town' }, { code: '082', name: 'Mwala' }
  ],
  '017': [ // Makueni
    { code: '083', name: 'Mbooni' }, { code: '084', name: 'Kilome' }, 
    { code: '085', name: 'Kaiti' }, { code: '086', name: 'Makueni' }, 
    { code: '087', name: 'Kibwezi West' }, { code: '088', name: 'Kibwezi East' }
  ],
  '018': [ // Nyandarua
    { code: '089', name: 'Kinangop' }, { code: '090', name: 'Kipipiri' }, 
    { code: '091', name: 'Ol Kalou' }, { code: '092', name: 'Ol Jorok' }, 
    { code: '093', name: 'Ndaragwa' }
  ],
  '019': [ // Nyeri
    { code: '094', name: 'Tetu' }, { code: '095', name: 'Kieni' }, 
    { code: '096', name: 'Mathira' }, { code: '097', name: 'Othaya' }, 
    { code: '098', name: 'Mukurwe-ini' }, { code: '099', name: 'Nyeri Town' }
  ],
  '020': [ // Kirinyaga
    { code: '100', name: 'Mwea' }, { code: '101', name: 'Gichugu' }, 
    { code: '102', name: 'Ndia' }, { code: '103', name: 'Kirinyaga Central' }
  ],
  '021': [ // Murang'a
    { code: '104', name: 'Kangema' }, { code: '105', name: 'Mathioya' }, 
    { code: '106', name: 'Kiharu' }, { code: '107', name: 'Kigumo' }, 
    { code: '108', name: 'Maragwa' }, { code: '109', name: 'Kandara' }, 
    { code: '110', name: 'Gatanga' }
  ],
  '022': [ // Kiambu
    { code: '111', name: 'Gatundu South' }, { code: '112', name: 'Gatundu North' }, 
    { code: '113', name: 'Juja' }, { code: '114', name: 'Thika Town' }, 
    { code: '115', name: 'Ruiru' }, { code: '116', name: 'Githunguri' }, 
    { code: '117', name: 'Kiambu' }, { code: '118', name: 'Kiambaa' }, 
    { code: '119', name: 'Kabete' }, { code: '120', name: 'Kikuyu' }, 
    { code: '121', name: 'Limuru' }, { code: '122', name: 'Lari' }
  ],
  '023': [ // Turkana
    { code: '123', name: 'Turkana North' }, { code: '124', name: 'Turkana West' }, 
    { code: '125', name: 'Turkana Central' }, { code: '126', name: 'Loima' }, 
    { code: '127', name: 'Turkana South' }, { code: '128', name: 'Turkana East' }
  ],
  '024': [ // West Pokot
    { code: '129', name: 'Kapenguria' }, { code: '130', name: 'Sigor' }, 
    { code: '131', name: 'Kacheliba' }, { code: '132', name: 'Pokot South' }
  ],
  '025': [ // Samburu
    { code: '133', name: 'Samburu West' }, { code: '134', name: 'Samburu North' }, 
    { code: '135', name: 'Samburu East' }
  ],
  '026': [ // Trans Nzoia
    { code: '136', name: 'Kwanza' }, { code: '137', name: 'Endebess' }, 
    { code: '138', name: 'Saboti' }, { code: '139', name: 'Kiminini' }, 
    { code: '140', name: 'Cherangany' }
  ],
  '027': [ // Uasin Gishu
    { code: '141', name: 'Soy' }, { code: '142', name: 'Turbo' }, 
    { code: '143', name: 'Moiben' }, { code: '144', name: 'Ainabkoi' }, 
    { code: '145', name: 'Kapseret' }, { code: '146', name: 'Kesses' }
  ],
  '028': [ // Elgeyo Marakwet
    { code: '147', name: 'Marakwet East' }, { code: '148', name: 'Marakwet West' }, 
    { code: '149', name: 'Keiyo North' }, { code: '150', name: 'Keiyo South' }
  ],
  '029': [ // Nandi
    { code: '151', name: 'Tinderet' }, { code: '152', name: 'Aldai' }, 
    { code: '153', name: 'Nandi Hills' }, { code: '154', name: 'Chesumei' }, 
    { code: '155', name: 'Emgwen' }, { code: '156', name: 'Mosop' }
  ],
  '030': [ // Baringo
    { code: '157', name: 'Tiaty' }, { code: '158', name: 'Baringo North' }, 
    { code: '159', name: 'Baringo Central' }, { code: '160', name: 'Baringo South' }, 
    { code: '161', name: 'Mogotio' }, { code: '162', name: 'Eldama Ravine' }
  ],
  '031': [ // Laikipia
    { code: '163', name: 'Laikipia West' }, { code: '164', name: 'Laikipia East' }, 
    { code: '165', name: 'Laikipia North' }
  ],
  '032': [ // Nakuru
    { code: '166', name: 'Molo' }, { code: '167', name: 'Njoro' }, 
    { code: '168', name: 'Naivasha' }, { code: '169', name: 'Gilgil' }, 
    { code: '170', name: 'Kuresoi South' }, { code: '171', name: 'Kuresoi North' }, 
    { code: '172', name: 'Subukia' }, { code: '173', name: 'Rongai' }, 
    { code: '174', name: 'Bahati' }, { code: '175', name: 'Nakuru Town West' }, 
    { code: '176', name: 'Nakuru Town East' }
  ],
  '033': [ // Narok
    { code: '177', name: 'Kilgoris' }, { code: '178', name: 'Emurua Dikirr' }, 
    { code: '179', name: 'Narok North' }, { code: '180', name: 'Narok East' }, 
    { code: '181', name: 'Narok South' }, { code: '182', name: 'Narok West' }
  ],
  '034': [ // Kajiado
    { code: '183', name: 'Kajiado North' }, { code: '184', name: 'Kajiado Central' }, 
    { code: '185', name: 'Kajiado East' }, { code: '186', name: 'Kajiado West' }, 
    { code: '187', name: 'Kajiado South' }
  ],
  '035': [ // Kericho
    { code: '188', name: 'Kipkelion East' }, { code: '189', name: 'Kipkelion West' }, 
    { code: '190', name: 'Ainamoi' }, { code: '191', name: 'Bureti' }, 
    { code: '192', name: 'Belgut' }, { code: '193', name: 'Sigowet/Soin' }
  ],
  '036': [ // Bomet
    { code: '194', name: 'Sotik' }, { code: '195', name: 'Chepalungu' }, 
    { code: '196', name: 'Bomet East' }, { code: '197', name: 'Bomet Central' }, 
    { code: '198', name: 'Konoin' }
  ],
  '037': [ // Kakamega
    { code: '199', name: 'Lugari' }, { code: '200', name: 'Likuyani' }, 
    { code: '201', name: 'Malava' }, { code: '202', name: 'Lurambi' }, 
    { code: '203', name: 'Navakholo' }, { code: '204', name: 'Mumias West' }, 
    { code: '205', name: 'Mumias East' }, { code: '206', name: 'Matungu' }, 
    { code: '207', name: 'Butere' }, { code: '208', name: 'Khwisero' }, 
    { code: '209', name: 'Shinyalu' }, { code: '210', name: 'Ikolomani' }
  ],
  '038': [ // Vihiga
    { code: '211', name: 'Vihiga' }, { code: '212', name: 'Sabatia' }, 
    { code: '213', name: 'Hamisi' }, { code: '214', name: 'Luanda' }, 
    { code: '215', name: 'Emuhaya' }
  ],
  '039': [ // Bungoma
    { code: '216', name: 'Mt. Elgon' }, { code: '217', name: 'Sirisia' }, 
    { code: '218', name: 'Kabuchai' }, { code: '219', name: 'Bumula' }, 
    { code: '220', name: 'Kanduyi' }, { code: '221', name: 'Webuye East' }, 
    { code: '222', name: 'Webuye West' }, { code: '223', name: 'Kimilili' }, 
    { code: '224', name: 'Tongaren' }
  ],
  '040': [ // Busia
    { code: '225', name: 'Teso North' }, { code: '226', name: 'Teso South' }, 
    { code: '227', name: 'Nambale' }, { code: '228', name: 'Matayos' }, 
    { code: '229', name: 'Butula' }, { code: '230', name: 'Funyula' }, 
    { code: '231', name: 'Budalangi' }
  ],
  '041': [ // Siaya
    { code: '232', name: 'Ugenya' }, { code: '233', name: 'Ugunja' }, 
    { code: '234', name: 'Alego Usonga' }, { code: '235', name: 'Gem' }, 
    { code: '236', name: 'Bondo' }, { code: '237', name: 'Rarieda' }
  ],
  '042': [ // Kisumu
    { code: '238', name: 'Kisumu East' }, { code: '239', name: 'Kisumu West' }, 
    { code: '240', name: 'Kisumu Central' }, { code: '241', name: 'Seme' }, 
    { code: '242', name: 'Nyando' }, { code: '243', name: 'Muhoroni' }, 
    { code: '244', name: 'Nyakach' }
  ],
  '043': [ // Homa Bay
    { code: '245', name: 'Kasipul' }, { code: '246', name: 'Kabondo Kasipul' }, 
    { code: '247', name: 'Karachuonyo' }, { code: '248', name: 'Rangwe' }, 
    { code: '249', name: 'Homa Bay Town' }, { code: '250', name: 'Ndhiwa' }, 
    { code: '251', name: 'Suba North' }, { code: '252', name: 'Suba South' }
  ],
  '044': [ // Migori
    { code: '253', name: 'Rongo' }, { code: '254', name: 'Awendo' }, 
    { code: '255', name: 'Suna East' }, { code: '256', name: 'Suna West' }, 
    { code: '257', name: 'Uriri' }, { code: '258', name: 'Nyatike' }, 
    { code: '259', name: 'Kuria West' }, { code: '260', name: 'Kuria East' }
  ],
  '045': [ // Kisii
    { code: '261', name: 'Bonchari' }, { code: '262', name: 'South Mugirango' }, 
    { code: '263', name: 'Bomachoge Borabu' }, { code: '264', name: 'Bobasi' }, 
    { code: '265', name: 'Bomachoge Chache' }, { code: '266', name: 'Nyaribari Masaba' }, 
    { code: '267', name: 'Nyaribari Chache' }, { code: '268', name: 'Kitutu Chache North' }, 
    { code: '269', name: 'Kitutu Chache South' }
  ],
  '046': [ // Nyamira
    { code: '270', name: 'Kitutu Masaba' }, { code: '271', name: 'West Mugirango' }, 
    { code: '272', name: 'North Mugirango' }, { code: '273', name: 'Borabu' }
  ],
  '047': [ // Nairobi
    { code: '274', name: 'Westlands' }, { code: '275', name: 'Dagoretti North' }, 
    { code: '276', name: 'Dagoretti South' }, { code: '277', name: 'Langata' }, 
    { code: '278', name: 'Kibra' }, { code: '279', name: 'Roysambu' }, 
    { code: '280', name: 'Kasarani' }, { code: '281', name: 'Ruaraka' }, 
    { code: '282', name: 'Embakasi South' }, { code: '283', name: 'Embakasi North' }, 
    { code: '284', name: 'Embakasi Central' }, { code: '285', name: 'Embakasi East' }, 
    { code: '286', name: 'Embakasi West' }, { code: '287', name: 'Makadara' }, 
    { code: '288', name: 'Kamukunji' }, { code: '289', name: 'Starehe' }, 
    { code: '290', name: 'Mathare' }
  ],
};

module.exports = constituencies;