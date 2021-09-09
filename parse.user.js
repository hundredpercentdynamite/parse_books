// ==UserScript==
// @name         Парсим книжки
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Создаём тэг <script> и грузим какую-то библиотеку для работы с pdf
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.1.1/jspdf.umd.min.js";
    document.head.append(script);

    script.onload = () => {
        // добавляем кнопку в интерфейс и вешаем на неё обработчик downloadBook
        const block = document.getElementsByClassName('controlBlock')[0];
        const button = document.createElement('button');
        button.addEventListener('click', downloadBook);
        button.innerText = "Скачать";
        button.style.cssText = "padding: 5px; background: #ff7f50; margin: 3px; cursor: pointer;"
        button.id = "downloadButton";
        block.append(button);

        const title = document.title;
        const param = window.location.search;
        // парсим id книжки, чтобы загружать её постранично
        const bookId = param.match(/\d*$/g)[0] || "";

        // http://elibrary.misis.ru/plugins/SecView/getDoc.php?id=11589&page=0&type=small/fast

        // задаём параметры будущей pdf
        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [900, 1240],
            putOnlyUsedFonts:true,
            floatPrecision: 16 // or "smart", default is 16
        });

        async function downloadBook() {
            // Беру со страницы информацию о кол-ве страниц в книге
            const counterDiv = document.getElementById('SecView-page-count');
            const counter = parseInt(counterDiv.innerText);

            // в цикле делаю запрос на каждую страницу
            for(let i = 0; i < counter; i++) {
              const response = await fetch(`http://elibrary.misis.ru/plugins/SecView/getDoc.php?id=${bookId}&page=${i}&type=large/fast`, {
                   "headers": {
                       "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                       "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
                   },
                   "referrerPolicy": "no-referrer-when-downgrade",
                   "body": null,
                   "method": "GET",
                   "mode": "cors",
                   "credentials": "include"
               });

                // запихиваю полученную картинку в pdf
                const imageBlob = await response.blob();
                const url = URL.createObjectURL(imageBlob);
                await doc.addImage(url, 'JPEG', 10, 10, 847, 1200, i);
                // добавляем новую страницу
                await doc.addPage([900, 1240], 'p');
            }

            // сохраняем pdf
            doc.save(`${title}.pdf`);
            return null;
        }
    }
})();
