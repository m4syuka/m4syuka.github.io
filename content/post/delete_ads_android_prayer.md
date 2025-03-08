+++
author = "m4syuka"
title = "Удаление рекламы из андроид приложения 'Молитвослов'"
date = "2025-03-08"
tags = [
    "android",
    "frida",
    "cracking"
]
categories = [
    "Крякинг"
]
+++
### Оглавление
+ [Вводные данные приложения](#вводные-данные-приложения)
+ [Задачи](#задачи)
    + [Используемые программы](#используемые-программы)
+ [Крякинг](#крякинг)
    + [Избавляемся от рекламы](#избавляемся-от-рекламы)
    + [Удаляем авторизацию через RuStore и VKID](#удаляем-авторизацию-через-rustore-и-vkid)
+ [Патчинг](#патчинг)

## Внимание
Данная статья предназначена исключительно для образовательных и информационных целей. Никакие взломанные версии приложений, игры или другое защищенное авторским правом программное обеспечение здесь не хранятся и не распространяются . Автор статьи не поддерживает и не поощряет пиратство, нарушение авторских прав или другие незаконные действия. Использование или распространение взломанного ПО нарушает законы об интеллектуальной собственности и может привести к юридическим последствиям.

Вся информация предоставляется в теоретическом или гипотетическом контексте, например, в виде обсуждений, руководств или исследований в области кибербезопасности, этического хакинга или анализа программного обеспечения. Это не призыв к действию и не руководство по взлому.

### Вводные данные приложения
* Разработчик  -  Peekaboo
* Версия - 4.2.1
* Ссылка на [google play приложения](https://play.google.com/store/apps/details?id=com.peekaboo.prayers)
### Введение
Обнаружил, что в приложение "Православный Молитвослов" добавили рекламу. Верующим людям это не понравилось и они начали ставить приложению низкий балл. Что незаслуженно, ведь приожение хорошее.

![image](/images/delete_ads_android_prayer/отзывы_пользователей.jpg)

Может разработчик сильно занят и у него банально нет времени исправить льющейся негатив в сторону его приложения? Поэтому я помогу ему!

### Задачи

Изучив отзывы я понял, что людей большего всего раздражает:

1. Навязчивая реклама

![image](/images/delete_ads_android_prayer/реклама.jpg)

2. Предложение авторизоваться через VK ID

![image](/images/delete_ads_android_prayer/авторизация_vk_id.jpg)

3. Предложение войти в RuStore

![image](/images/delete_ads_android_prayer/авторизация_рустор.jpg)

Но исходного кода приложения у меня нет, значит будем **крякать это дело**.

#### Используемые программы
+ [Jadx-Gui](https://github.com/skylot/jadx)
+ [AntiSplit-M](https://github.com/AbdurazaaqMohammed/AntiSplit-M)
+ Android Studio virtual device
+ [frida](https://frida.re/)

### Крякинг
#### Избавляемся от рекламы
Начнем с изучения исходного кода apk файла, загнав его в [Jadx-gui](#используемые-программы).

![image](/images/delete_ads_android_prayer/исходный_код.jpg)

Как видно, код обфусцирован. Глянем в AndroidManifest.xml, может быть там что-то есть.\
В манифесте взляд падает на такую активити: 
```xml
...
android:name="com.my.target.common.MyTargetActivity
...
```

Рядом с пакетом `com.my.target` лежит `com.my.tracker` \
Что это за пакеты?

![image](/images/delete_ads_android_prayer/mytracker_пакет.jpg)

Изучив первые три ссылки я пришел к выводу, что они как-то связаны с рекламой. Отлично!

В пакете `my.tracker` есть класс `MyTrackerConfig`. Поставим на него хук с помощью [frida](#используемые-программы) и посмотрим какую-нибудь рекламу.\
Код хука:
```js
Java.perform(function() {
    let MyTrackerConfig = Java.use("com.my.tracker.MyTrackerConfig");
    MyTrackerConfig["$init"].implementation = function (c2006w0) {
        console.log(`MyTrackerConfig.$init is called: c2006w0=${c2006w0}`);
        this["$init"](c2006w0);
    };
});
```
![image](/images/delete_ads_android_prayer/хук_функции_показа_рекламы.jpg)

Класс инициализируется при создании рекламы. Мы на верном пути!

Теперь с помощью все той же frida выведем backtrace вызова конструктора.\
Код:
```js
Java.perform(function() {
    const thread = Java.use('java.lang.Thread').$new();
    let MyTrackerConfig = Java.use("com.my.tracker.MyTrackerConfig");
    MyTrackerConfig["$init"].implementation = function (c2006w0) {
        console.log(`MyTrackerConfig.$init is called: c2006w0=${c2006w0}`);
        const stacktrace = thread.currentThread().getStackTrace();
        stacktrace.forEach( (element) => {
            console.log(element);
        });
        this["$init"](c2006w0);
    };
});
```
![image](/images/delete_ads_android_prayer/backtrace_рекламы.jpg)

Начав анализ backtrace-а с конца мы наткнемся на метод `com.my.target.A.q()`, у которого в одном из условий просходит вызов метода `e()`
```js
    public static boolean e(Context context) {
        NetworkCapabilities networkCapabilities;
        try {
            ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService("connectivity");
            Network activeNetwork = connectivityManager.getActiveNetwork();
            if (activeNetwork == null || (networkCapabilities = connectivityManager.getNetworkCapabilities(activeNetwork)) == null) {
                return false;
            }
            if (!networkCapabilities.hasTransport(1) && !networkCapabilities.hasTransport(0)) {
                if (!networkCapabilities.hasTransport(3)) {
                    return false;
                }
            }
            return true;
        } catch (Throwable th) {
            AbstractC0768s.b("HttpAdRequest: can't check network state " + th.getMessage());
            return false;
        }
    }

```
Суть метода - проверка подключение к интернету. Если оно есть, возвращаем `true`, в противном случае `false`.

Попробуем с помощью frida заставить данный метод **всегда** возвращать `false`.\
Код:
```js
Java.perform(function() {
    let b3 = Java.use("I5.b3");
    b3["e"].implementation = function (context) {
        console.log(`b3.e is called: context=${context}`);
        let result = this["e"](context);
        console.log(`b3.e should be be result=${result}`);
        console.log('but we return false')
        return false;
    };
});
```
![image](/images/delete_ads_android_prayer/патчинг_рекламы.jpg)

Всё сработало!

#### Удаляем авторизацию через RuStore и VKID
В AndroidManifest.xml есть активити 
```xml
...
android:name="ru.rustore.sdk.activitylauncher.RuStoreActivityLauncher" 
...
```

Посмотрим на неё в исходном коде:

![image](/images/delete_ads_android_prayer/рустор_активити.jpg)

Активити как активити, ничего интересного. Вопрос в том, где оно создается? А создается оно чуть выше:
```js
public final Intent a(Context context, ResultReceiver resultReceiver, Intent confirmationIntent) {
            t.e(context, "context");
            t.e(resultReceiver, "resultReceiver");
            t.e(confirmationIntent, "confirmationIntent");
            Intent intent = new Intent(context, (Class<?>) RuStoreActivityLauncher.class);
            if (!(context instanceof Activity)) {
                intent.setFlags(268435456);
            }
            intent.putExtra("RESULT_RECEIVER", resultReceiver);
            intent.putExtra("CONFIRMATION_PENDING_INTENT", PendingIntent.getActivity(context, 0, confirmationIntent, 1140850688));
            return intent;
        } 
```
После чего данное активити стартует в 
```js
public static final void a(Context context, Intent intent, Wa.c callback) {
        t.e(context, "<this>");
        t.e(intent, "intent");
        t.e(callback, "callback");
        context.startActivity(RuStoreActivityLauncher.f32737c.a(context, new Wa.b(callback), intent));
    }
```

Попробуем с помощью frida заставить активити возвращать null\
Код:
```js
Java.perform(function() {
    let a = Java.use("ru.rustore.sdk.activitylauncher.RuStoreActivityLauncher$a");
    a["a"].implementation = function (context, resultReceiver, confirmationIntent) {
        console.log(`a.a is called: context=${context}, resultReceiver=${resultReceiver}, confirmationIntent=${confirmationIntent}`);
        let result = this["a"](context, resultReceiver, confirmationIntent);
        console.log(`a.a result=${result}`);
        return null;
    };
});
```
![iamage](/images/delete_ads_android_prayer/рустор_патчинг.jpg)

Да, предложения авторизации ни черезе RuStore, ни через VKID нету.

Считаю результат достигнутым!

Общий frida-script:
```js
Java.perform(function() {

    let b3 = Java.use("I5.b3");
    b3["e"].implementation = function (context) {
        console.log(`b3.e is called: context=${context}`);
        let result = this["e"](context);
        console.log(`b3.e should be be result=${result}`);
        console.log('but we return false')
        return false;
    };

    
    let a = Java.use("ru.rustore.sdk.activitylauncher.RuStoreActivityLauncher$a");
    a["a"].implementation = function (context, resultReceiver, confirmationIntent) {
        console.log(`a.a is called: context=${context}, resultReceiver=${resultReceiver}, confirmationIntent=${confirmationIntent}`);
        let result = this["a"](context, resultReceiver, confirmationIntent);
        console.log(`a.a result=${result}`);
        return null;
    };
    
});

```
#### Патчинг
Распакуем apk файл:
```sh
apktool d -r com.peekaboo.prayers\ v4.2.1_antisplit.apk
```
Найдем метод, который отвечает за показ рекламы и запатчим его:

```smali
.method public static e(Landroid/content/Context;)Z
    .locals 3

    const/4 v0, 0x0
    return v0

.end method 
```

Аналогично и с методом авторизации в RuStore:
```smali
.method public final a(Landroid/content/Context;Landroid/os/ResultReceiver;Landroid/content/Intent;)Landroid/content/Intent;
    .locals 2

    const/4 v0, 0x0
    return-object v0
    
.end method
```
После чего соберем его:
```sh
apktool b com.peekaboo.prayers\ v4.2.1_antisplit -o prayer_patch.apk
```
Создадим сертификат для подписи:
```sh
keytool -genkey -v -keystore my_key.keystore -alias my_alias -keyalg RSA -keysize 2048 -validity 10000
```
И подпишем:
```sh
apksigner sign --ks my_key.keystore --ks-key-alias my_alias prayer_patch.apk
```
Готово!