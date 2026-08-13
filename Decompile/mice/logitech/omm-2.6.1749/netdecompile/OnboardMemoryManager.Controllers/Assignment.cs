using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using OnboardMemoryManager.Components;
using OnboardMemoryManager.Helpers;
using OnboardMemoryManager.Models;
using logi.hidppio;

namespace OnboardMemoryManager.Controllers;

public class Assignment : INotifyPropertyChanged
{
	public class AssignmentActionListChangedEventArgs : EventArgs
	{
		public OnboardMemoryManager.Models.Action Action { get; set; }

		public bool IsRecording { get; set; }

		public bool ProfileCycleWarning { get; set; }
	}

	private enum staticActions
	{
		INVALID,
		NEW_KEYSTROKE
	}

	private OnboardMemoryManager.Models.Profile _profile;

	private OnboardMemoryManager.Models.Assignment _assignment;

	private ObservableCollection<ComboSelectDataItem> _assignments = new ObservableCollection<ComboSelectDataItem>();

	private const int _assignmentStackSize = 3;

	private Queue<HIDAction> _assignmentStack = new Queue<HIDAction>(3);

	private bool _assignmentStaticActionSelectedLock;

	private CancellationTokenSource _recordingTaskCancellationTokenSource;

	private bool _isRecording;

	public ComboSelectDataItem ComboSelectItem
	{
		get
		{
			return _assignment.Action;
		}
		set
		{
			if (value == _assignment.Action)
			{
				return;
			}
			if (IsRecording)
			{
				if (_recordingTaskCancellationTokenSource != null)
				{
					_recordingTaskCancellationTokenSource.Cancel();
				}
				stopRecording();
			}
			if (value is HIDAction)
			{
				_assignment.Action = value as OnboardMemoryManager.Models.Action;
				CheckProfileCycleWarning();
				OnPropertyChanged("ComboSelectItem");
			}
			else if (value != null)
			{
				onAssignmentStaticActionSelected(value as OnboardMemoryManager.Models.Action);
				OnPropertyChanged("ComboSelectItem");
			}
			else
			{
				_assignment.Action = value as OnboardMemoryManager.Models.Action;
			}
		}
	}

	public ObservableCollection<ComboSelectDataItem> ActionsComboSelectItems
	{
		get
		{
			return _assignments;
		}
		set
		{
			if (value != _assignments)
			{
				_assignments = value;
				OnPropertyChanged("ActionsComboSelectItems");
			}
		}
	}

	public bool IsRecording
	{
		get
		{
			return _isRecording;
		}
		set
		{
			if (value != _isRecording)
			{
				_isRecording = value;
				OnPropertyChanged("IsRecording");
				triggerAssignmentActionListChangedEvent(_assignment.Action, value, ProfileCycleWarning);
			}
		}
	}

	public bool IsEnabled
	{
		get
		{
			return _assignment.IsEnabled;
		}
		set
		{
			if (value != _assignment.IsEnabled)
			{
				_assignment.IsEnabled = value;
				OnPropertyChanged("IsEnabled");
			}
		}
	}

	public bool ProfileCycleWarning
	{
		get
		{
			return _assignment.ProfileCycleWarning;
		}
		set
		{
			if (value != _assignment.ProfileCycleWarning)
			{
				_assignment.ProfileCycleWarning = value;
				OnPropertyChanged("ProfileCycleWarning");
				triggerAssignmentActionListChangedEvent(_assignment.Action, IsRecording, value);
			}
		}
	}

	public string ButtonIndexLabel => VisibleIndex.ToString() ?? "";

	public int VisibleIndex
	{
		get
		{
			return _assignment.VisibleIndex;
		}
		set
		{
			if (value != _assignment.VisibleIndex)
			{
				_assignment.VisibleIndex = value;
				OnPropertyChanged("VisibleIndex");
			}
		}
	}

	public OnboardMemoryManager.Models.Assignment Model => _assignment;

	public event PropertyChangedEventHandler PropertyChanged;

	public event EventHandler<AssignmentActionListChangedEventArgs> AssignmentActionListChanged;

	public Assignment(OnboardMemoryManager.Models.Profile profile, OnboardMemoryManager.Models.Assignment assignment)
	{
		_profile = profile;
		_assignment = assignment;
		_assignment.PropertyChanged += AssignmentPropertyChanged;
		GenerateAssignmentCache();
	}

	protected void OnPropertyChanged(string propertyName)
	{
		this.PropertyChanged?.Invoke(_assignment, new PropertyChangedEventArgs(propertyName));
		this.PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	private void AssignmentPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		//IL_003b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0045: Invalid comparison between Unknown and I4
		//IL_004d: Unknown result type (might be due to invalid IL or missing references)
		//IL_0053: Invalid comparison between Unknown and I4
		if (e.PropertyName == "Assignments")
		{
			GenerateAssignmentCache();
			foreach (ComboSelectDataItem assignment in _assignments)
			{
				if (assignment is HIDAction hIDAction && (int)hIDAction.Macro.button_behavior == 128 && (int)hIDAction.Macro.remapping_opcode == 2)
				{
					_assignmentStack.Enqueue(hIDAction);
				}
			}
		}
		this.PropertyChanged?.Invoke(sender, e);
	}

	public void GenerateAssignmentCache()
	{
		//IL_00d9: Unknown result type (might be due to invalid IL or missing references)
		//IL_00e3: Invalid comparison between Unknown and I4
		//IL_00ef: Unknown result type (might be due to invalid IL or missing references)
		//IL_00f6: Invalid comparison between Unknown and I4
		//IL_00ff: Unknown result type (might be due to invalid IL or missing references)
		//IL_0106: Invalid comparison between Unknown and I4
		//IL_010f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0115: Invalid comparison between Unknown and I4
		ActionsComboSelectItems.Clear();
		Application current = Application.Current;
		List<ComboSelectDataItem> list = new List<ComboSelectDataItem>(_assignment.Actions.Cast<ComboSelectDataItem>().Concat(new List<ComboSelectDataItem>
		{
			new ComboSelectItemSeparator(),
			new OnboardMemoryManager.Models.Action
			{
				Title = "Assignments_New_Keystroke",
				Foreground = (Brush)current.FindResource("ColorBrush.Primary"),
				ID = 1
			}
		}).ToList());
		bool flag = true;
		if (_profile is HIDProfile { Device: HIDMouse device } && device.OnboardProfilesInfo.profile_count < 2)
		{
			flag = false;
		}
		foreach (ComboSelectDataItem item in list)
		{
			HIDAction hIDAction = item as HIDAction;
			if ((flag || hIDAction == null || !((hIDAction.Macro != null) & ((int)hIDAction.Macro.button_behavior == 144)) || ((int)hIDAction.Macro.function_opcode != 10 && (int)hIDAction.Macro.function_opcode != 9 && (int)hIDAction.Macro.function_opcode != 8)) && !ActionsComboSelectItems.Contains(item))
			{
				ActionsComboSelectItems.Add(item);
			}
		}
	}

	private void onAssignmentStaticActionSelected(OnboardMemoryManager.Models.Action action)
	{
		if (action != null && !_assignmentStaticActionSelectedLock && action.ID == 1)
		{
			_assignmentStaticActionSelectedLock = true;
			HIDAction hIDAction = new HIDAction(0);
			HIDAction previousAction = _assignment.Action as HIDAction;
			_assignment.Actions.Add(hIDAction);
			GenerateAssignmentCache();
			ComboSelectItem = hIDAction;
			triggerAssignmentActionListChangedEvent(hIDAction, IsRecording, ProfileCycleWarning);
			_assignmentStaticActionSelectedLock = false;
			recordKeystroke(hIDAction, previousAction);
		}
	}

	private void recordKeystroke(HIDAction action, HIDAction previousAction = null)
	{
		//IL_0055: Unknown result type (might be due to invalid IL or missing references)
		//IL_0066: Unknown result type (might be due to invalid IL or missing references)
		Thread.Sleep(125);
		IsRecording = true;
		_recordingTaskCancellationTokenSource = new CancellationTokenSource();
		CancellationToken cancellationToken = _recordingTaskCancellationTokenSource.Token;
		action.Macro.button_behavior = (BUTTON_BEHAVIOR)128;
		action.Macro.remapping_opcode = (REMAPPING_OPCODES)2;
		InterceptKeys.Instance.StartListener();
		InterceptKeys.Instance.OnKeyPress += onKeyPressCallback;
		Task.Factory.StartNew((Func<Task>)async delegate
		{
			try
			{
				await Task.Delay(5000, cancellationToken);
			}
			catch (TaskCanceledException)
			{
			}
			stopRecording();
			if (action.Macro.key_code == 0)
			{
				_assignment.Actions.Remove(action);
				Application.Current.Dispatcher.Invoke(delegate
				{
					ActionsComboSelectItems.Remove(action);
				});
				ComboSelectItem = previousAction;
				triggerAssignmentActionListChangedEvent(previousAction, IsRecording, ProfileCycleWarning);
			}
		});
	}

	private void onKeyPressCallback(object sender, InterceptKeys.KeyPressArgs e)
	{
		//IL_0244: Unknown result type (might be due to invalid IL or missing references)
		if (_recordingTaskCancellationTokenSource != null)
		{
			_recordingTaskCancellationTokenSource.Cancel();
		}
		HIDAction hIDAction = ComboSelectItem as HIDAction;
		if (hIDAction == null)
		{
			return;
		}
		hIDAction.Macro.modifier = 0;
		if ((e.Modifiers & 1) > 0)
		{
			OnboardMacro macro = hIDAction.Macro;
			macro.modifier++;
		}
		if ((e.Modifiers & 2) > 0)
		{
			OnboardMacro macro2 = hIDAction.Macro;
			macro2.modifier += 16;
		}
		if ((e.Modifiers & 4) > 0)
		{
			OnboardMacro macro3 = hIDAction.Macro;
			macro3.modifier += 4;
		}
		if ((e.Modifiers & 8) > 0)
		{
			OnboardMacro macro4 = hIDAction.Macro;
			macro4.modifier += 64;
		}
		if ((e.Modifiers & 0x40) > 0)
		{
			OnboardMacro macro5 = hIDAction.Macro;
			macro5.modifier += 2;
		}
		if ((e.Modifiers & 0x80) > 0)
		{
			OnboardMacro macro6 = hIDAction.Macro;
			macro6.modifier += 32;
		}
		if ((e.Modifiers & 0x10) > 0)
		{
			OnboardMacro macro7 = hIDAction.Macro;
			macro7.modifier += 8;
		}
		if ((e.Modifiers & 0x20) > 0)
		{
			OnboardMacro macro8 = hIDAction.Macro;
			macro8.modifier += 128;
		}
		int key = e.ScanCode;
		switch (e.KeyCode)
		{
		case Key.Cancel:
			key = 57414;
			break;
		case Key.Pause:
			key = 57629;
			break;
		case Key.NumLock:
			key = 69;
			break;
		}
		lock (HIDConsumerDevice.Instance)
		{
			if (!HIDConsumerDevice.Instance.ScanCode.ContainsKey(key))
			{
				Console.WriteLine("Unidentified scan code received, no HID Code mapping. Modifiers={0} Key={1} ScanCode={2}", e.Modifiers, e.KeyCode, e.ScanCode);
			}
			else
			{
				HIDConsumerDevice.HIDScanCode hIDScanCode = HIDConsumerDevice.Instance.ScanCode[key];
				Console.WriteLine("Key captured Modifiers={0} Key={1} ScanCode={2}, HID Page={3}, HID Code={4}, HID Descr={5}", e.Modifiers, e.KeyCode, e.ScanCode, hIDScanCode.HIDPage, hIDScanCode.HIDCode, hIDScanCode.KeyName);
				if (hIDScanCode.HIDPage != 7)
				{
					hIDAction.Macro.remapping_opcode = (REMAPPING_OPCODES)3;
					hIDAction.Macro.consumer_key = (hIDScanCode.HIDPage << 8) | hIDScanCode.HIDCode;
				}
				else
				{
					hIDAction.Macro.key_code = hIDScanCode.HIDCode;
				}
				bool flag = false;
				int num = 0;
				foreach (OnboardMemoryManager.Models.Action action in _assignment.Actions)
				{
					if (action is HIDAction hIDAction2 && num != _assignment.Actions.Count() - 1 && hIDAction2.Macro == hIDAction.Macro)
					{
						_assignment.Actions.RemoveAt(_assignment.Actions.Count - 1);
						hIDAction = hIDAction2;
						flag = true;
						break;
					}
					num++;
				}
				if (!flag)
				{
					if (_assignmentStack.Count() == 3)
					{
						HIDAction removedItem = _assignmentStack.Dequeue();
						_assignment.Actions.Remove(removedItem);
						Application.Current.Dispatcher.Invoke(delegate
						{
							ActionsComboSelectItems.Remove(removedItem);
						});
					}
					_assignmentStack.Enqueue(hIDAction);
					hIDAction.RegenerateTitle();
					OnPropertyChanged("Action");
				}
				else
				{
					hIDAction.RegenerateTitle();
					ComboSelectItem = hIDAction;
					GenerateAssignmentCache();
					OnPropertyChanged("Action");
					triggerAssignmentActionListChangedEvent(hIDAction, IsRecording, ProfileCycleWarning);
				}
			}
		}
		stopRecording();
	}

	private void stopRecording()
	{
		InterceptKeys.Instance.OnKeyPress -= onKeyPressCallback;
		InterceptKeys.Instance.StopListener();
		IsRecording = false;
		triggerAssignmentActionListChangedEvent(_assignment.Action, IsRecording, ProfileCycleWarning);
	}

	private void triggerAssignmentActionListChangedEvent(OnboardMemoryManager.Models.Action action, bool isRecording, bool profileCycleWarning)
	{
		Application.Current.Dispatcher.Invoke(delegate
		{
			AssignmentActionListChangedEventArgs e = new AssignmentActionListChangedEventArgs
			{
				Action = action,
				IsRecording = isRecording,
				ProfileCycleWarning = profileCycleWarning
			};
			this.AssignmentActionListChanged(this, e);
		});
	}

	public void CheckProfileCycleWarning()
	{
		_ = _assignment.Action;
		HIDAssignment ownHidAssignment = _assignment as HIDAssignment;
		if (ownHidAssignment == null || !(_profile is HIDProfile { Device: HIDDevice device }))
		{
			return;
		}
		IEnumerable<Assignment> source = from p in device.Profiles.OfType<HIDProfile>()
			where p.Enabled
			select (!ownHidAssignment.isGshift) ? p.Assignments[ownHidAssignment.Index] : p.GShiftAssignments[ownHidAssignment.Index];
		IEnumerable<HIDAssignment> source2 = source.Select((Assignment a) => a.Model).OfType<HIDAssignment>();
		IEnumerable<HIDAction> source3 = source2.Select((HIDAssignment a) => a.Action).OfType<HIDAction>();
		bool flag = source3.Any(delegate(HIDAction button)
		{
			//IL_0006: Unknown result type (might be due to invalid IL or missing references)
			//IL_0010: Invalid comparison between Unknown and I4
			//IL_0018: Unknown result type (might be due to invalid IL or missing references)
			//IL_001f: Invalid comparison between Unknown and I4
			//IL_0027: Unknown result type (might be due to invalid IL or missing references)
			//IL_002d: Invalid comparison between Unknown and I4
			//IL_0035: Unknown result type (might be due to invalid IL or missing references)
			//IL_003c: Invalid comparison between Unknown and I4
			bool num2 = (int)button.Macro.button_behavior == 144;
			bool flag3 = (int)button.Macro.function_opcode == 10 || (int)button.Macro.function_opcode == 8 || (int)button.Macro.function_opcode == 9;
			return num2 && flag3;
		});
		bool flag2 = source3.Any(delegate(HIDAction button)
		{
			//IL_0006: Unknown result type (might be due to invalid IL or missing references)
			//IL_0010: Invalid comparison between Unknown and I4
			//IL_0018: Unknown result type (might be due to invalid IL or missing references)
			//IL_001f: Invalid comparison between Unknown and I4
			//IL_0027: Unknown result type (might be due to invalid IL or missing references)
			//IL_002d: Invalid comparison between Unknown and I4
			//IL_0035: Unknown result type (might be due to invalid IL or missing references)
			//IL_003c: Invalid comparison between Unknown and I4
			bool num2 = (int)button.Macro.button_behavior == 144;
			bool flag3 = (int)button.Macro.function_opcode == 10 || (int)button.Macro.function_opcode == 8 || (int)button.Macro.function_opcode == 9;
			return !num2 || !flag3;
		});
		bool shouldDisplayProfileCyclingWarning = flag && flag2;
		bool num = ProfileCycleWarning != shouldDisplayProfileCyclingWarning;
		source2.ToList().ForEach(delegate(HIDAssignment a)
		{
			a.ProfileCycleWarning = shouldDisplayProfileCyclingWarning;
		});
		if (num)
		{
			source.ToList().ForEach(delegate(Assignment a)
			{
				a.OnPropertyChanged("ProfileCycleWarning");
			});
		}
	}

	public void FixProfileCycleWarning()
	{
		//IL_0108: Unknown result type (might be due to invalid IL or missing references)
		//IL_0112: Invalid comparison between Unknown and I4
		//IL_0120: Unknown result type (might be due to invalid IL or missing references)
		//IL_0127: Invalid comparison between Unknown and I4
		//IL_0135: Unknown result type (might be due to invalid IL or missing references)
		//IL_013b: Invalid comparison between Unknown and I4
		//IL_0149: Unknown result type (might be due to invalid IL or missing references)
		//IL_0150: Invalid comparison between Unknown and I4
		_ = _assignment.Action;
		if (!(_assignment is HIDAssignment hIDAssignment) || !(_profile is HIDProfile { Device: HIDDevice device }))
		{
			return;
		}
		Dictionary<int, HIDAction> dictionary = new Dictionary<int, HIDAction>();
		foreach (OnboardMemoryManager.Models.Profile profile in device.Profiles)
		{
			if (profile is HIDProfile { Enabled: not false } hIDProfile2 && (hIDAssignment.isGshift ? hIDProfile2.GShiftAssignments[hIDAssignment.Index] : hIDProfile2.Assignments[hIDAssignment.Index]).Model is HIDAssignment hIDAssignment2)
			{
				HIDAction hIDAction = hIDAssignment2.Action as HIDAction;
				dictionary[Feature8100.HashMacro(hIDAction.Macro)] = hIDAction;
			}
		}
		HIDAction hIDAction2 = null;
		foreach (KeyValuePair<int, HIDAction> item in dictionary)
		{
			if ((int)item.Value.Macro.button_behavior == 144 && ((int)item.Value.Macro.function_opcode == 10 || (int)item.Value.Macro.function_opcode == 8 || (int)item.Value.Macro.function_opcode == 9))
			{
				hIDAction2 = item.Value;
				break;
			}
		}
		if (hIDAction2 == null)
		{
			Console.WriteLine("Failed to find any qualifying profile cycling command");
			return;
		}
		foreach (OnboardMemoryManager.Models.Profile profile2 in device.Profiles)
		{
			if (profile2 is HIDProfile { Enabled: not false } hIDProfile3 && (hIDAssignment.isGshift ? hIDProfile3.GShiftAssignments[hIDAssignment.Index] : hIDProfile3.Assignments[hIDAssignment.Index]).Model is HIDAssignment hIDAssignment3)
			{
				hIDAssignment3.ProfileCycleWarning = false;
				hIDAssignment3.Action = hIDAction2;
			}
		}
		OnPropertyChanged("ProfileCycleWarning");
		OnPropertyChanged("ComboSelectItem");
	}
}
