using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Logitech.ComponentModel;
using OnboardMemoryManager.Models;
using OnboardMemoryManager.Properties;
using logi.hidppio;

namespace OnboardMemoryManager.Controllers;

public sealed class Lighting : ObservableObject
{
	public class LightingOption : ObservableObject
	{
		private int _effect_id;

		public string Title => EffectToString((EFFECT_ID)(byte)EffectID);

		public int EffectID
		{
			get
			{
				return _effect_id;
			}
			set
			{
				if (value != _effect_id)
				{
					_effect_id = value;
					OnPropertyChanged("EffectID");
				}
			}
		}

		public static string EffectToString(EFFECT_ID effectID)
		{
			//IL_0000: Unknown result type (might be due to invalid IL or missing references)
			//IL_0003: Invalid comparison between Unknown and I4
			//IL_0026: Unknown result type (might be due to invalid IL or missing references)
			//IL_0029: Invalid comparison between Unknown and I4
			//IL_0005: Unknown result type (might be due to invalid IL or missing references)
			//IL_001f: Expected I4, but got Unknown
			//IL_002b: Unknown result type (might be due to invalid IL or missing references)
			//IL_002e: Invalid comparison between Unknown and I4
			//IL_001f: Unknown result type (might be due to invalid IL or missing references)
			//IL_0022: Invalid comparison between Unknown and I4
			//IL_0030: Unknown result type (might be due to invalid IL or missing references)
			//IL_0033: Unknown result type (might be due to invalid IL or missing references)
			//IL_0049: Expected I4, but got Unknown
			if ((int)effectID <= 10)
			{
				switch ((int)effectID)
				{
				default:
					if ((int)effectID != 10)
					{
						goto IL_007b;
					}
					return Resources.Lighting_Effect_Breathing;
				case 0:
					return Resources.Lighting_Effect_Off;
				case 3:
					break;
				case 1:
					return Resources.Lighting_Effect_Fixed;
				case 4:
					goto IL_0063;
				case 2:
					goto IL_007b;
				}
			}
			else
			{
				if ((int)effectID == 15)
				{
					return Resources.Lighting_Effect_Snipe_Pulse_Cyan_Pink;
				}
				if ((int)effectID == 16)
				{
					return Resources.Lighting_Effect_Neural_Wave_Cyan_Pink;
				}
				switch (effectID - 21)
				{
				case 0:
					break;
				case 1:
					goto IL_0063;
				case 3:
					return Resources.Lighting_Effect_Smooth_Star_Breathing;
				default:
					goto IL_007b;
				}
			}
			return Resources.Lighting_Effect_Cycling;
			IL_0063:
			return Resources.Lighting_Effect_Color_Wave;
			IL_007b:
			return "";
		}
	}

	private HIDDevice _hidDevice;

	private bool _supports_lighting;

	public ObservableCollection<LightingOption> Options = new ObservableCollection<LightingOption>();

	public bool IsSupported
	{
		get
		{
			return _supports_lighting;
		}
		set
		{
			if (value != _supports_lighting)
			{
				_supports_lighting = value;
				OnPropertyChanged("IsSupported");
			}
		}
	}

	public Lighting(HIDDevice device)
	{
		_hidDevice = device;
	}

	public async Task Init()
	{
		Options.Clear();
		if (canSupportLighting())
		{
			if (await ((DeviceBase)_hidDevice.HidppDeviceHandle).HasFeature(32881))
			{
				await Add8071Options();
			}
			else if (await ((DeviceBase)_hidDevice.HidppDeviceHandle).HasFeature(32880))
			{
				await Add8070Options();
			}
		}
	}

	private async Task Add8071Options()
	{
		Feature8071 f8071 = ((DeviceBase)_hidDevice.HidppDeviceHandle).GetFeature<Feature8071>();
		DeviceInfo deviceInfo = await f8071.GetDeviceInfo();
		HashSet<EFFECT_ID> supported_effects = new HashSet<EFFECT_ID>();
		for (int rgb_cluster_index = 0; rgb_cluster_index < deviceInfo.rgb_cluster_count; rgb_cluster_index++)
		{
			HashSet<EFFECT_ID> cluster_supported_effects = new HashSet<EFFECT_ID>();
			RGBClusterInfo rgb_cluster_info = await f8071.GetRGBClusterInfo(rgb_cluster_index);
			for (int rgb_effect_index = 0; rgb_effect_index < rgb_cluster_info.effects_number; rgb_effect_index++)
			{
				cluster_supported_effects.Add((await f8071.GetEffectInfo(rgb_cluster_index, rgb_effect_index)).effect_id);
			}
			if (rgb_cluster_index == 0)
			{
				supported_effects.UnionWith(cluster_supported_effects);
			}
			else
			{
				supported_effects.IntersectWith(cluster_supported_effects);
			}
		}
		for (int rgb_cluster_index = 0; rgb_cluster_index < deviceInfo.multi_cluster_effect_count; rgb_cluster_index++)
		{
			supported_effects.Add((await f8071.GetEffectInfo(255, rgb_cluster_index)).effect_id);
		}
		foreach (EFFECT_ID item in supported_effects)
		{
			if ((int)item <= 10)
			{
				switch ((int)item)
				{
				default:
					if ((int)item != 10)
					{
						continue;
					}
					break;
				case 0:
					Options.Add(new LightingOption
					{
						EffectID = (int)item
					});
					continue;
				case 1:
				case 3:
				case 4:
					break;
				case 2:
					continue;
				}
			}
			else if (item - 15 > 1 && item - 21 > 1 && (int)item != 24)
			{
				continue;
			}
			Options.Add(new LightingOption
			{
				EffectID = (int)item
			});
			IsSupported = true;
		}
	}

	private async Task Add8070Options()
	{
		Feature8070 feature = ((DeviceBase)_hidDevice.HidppDeviceHandle).GetFeature<Feature8070>();
		if ((((Feature)feature).Descr.Options & 0x40) == 0)
		{
			IsSupported = (await feature.GetInfo()).zone_count > 0;
			if (IsSupported)
			{
				Options.Add(new LightingOption
				{
					EffectID = 0
				});
				Options.Add(new LightingOption
				{
					EffectID = 1
				});
				Options.Add(new LightingOption
				{
					EffectID = 3
				});
				Options.Add(new LightingOption
				{
					EffectID = 10
				});
			}
		}
	}

	private bool canSupportLighting()
	{
		return (ulong)_hidDevice.ProductID switch
		{
			4644337115725824000uL => false, 
			4642302164515946496uL => false, 
			12692340589811728384uL => false, 
			_ => true, 
		};
	}
}
