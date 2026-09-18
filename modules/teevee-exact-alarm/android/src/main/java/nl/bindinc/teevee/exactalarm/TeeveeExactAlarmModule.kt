package nl.bindinc.teevee.exactalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TeeveeExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TeeveeExactAlarm")

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function true
      }

      val context = appContext.reactContext ?: return@Function false
      val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.canScheduleExactAlarms()
    }

    AsyncFunction("openExactAlarmSettingsAsync") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@AsyncFunction true
      }

      val activity = appContext.currentActivity ?: return@AsyncFunction false
      val intent = Intent(
        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
        Uri.parse("package:${activity.packageName}"),
      )
      activity.startActivity(intent)
      true
    }.runOnQueue(Queues.MAIN)
  }
}
