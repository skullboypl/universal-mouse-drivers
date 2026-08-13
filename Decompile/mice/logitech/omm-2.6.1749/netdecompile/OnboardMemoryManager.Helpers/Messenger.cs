using System;
using System.Collections.Generic;

namespace OnboardMemoryManager.Helpers;

public class Messenger
{
	private static Messenger _instance;

	private Dictionary<Type, List<Delegate>> _subscribers = new Dictionary<Type, List<Delegate>>();

	public static Messenger Instance
	{
		get
		{
			if (_instance == null)
			{
				_instance = new Messenger();
			}
			return _instance;
		}
	}

	public void Subscribe<TMessage>(Action<TMessage> action)
	{
		Type typeFromHandle = typeof(TMessage);
		if (!_subscribers.ContainsKey(typeFromHandle))
		{
			_subscribers[typeFromHandle] = new List<Delegate>();
		}
		_subscribers[typeFromHandle].Add(action);
	}

	public void Unsubscribe<TMessage>(Action<TMessage> action)
	{
		Type typeFromHandle = typeof(TMessage);
		if (_subscribers.ContainsKey(typeFromHandle))
		{
			_subscribers[typeFromHandle].Remove(action);
		}
	}

	public void SendToAllSubscribers<TMessage>(TMessage message)
	{
		Type typeFromHandle = typeof(TMessage);
		if (!_subscribers.ContainsKey(typeFromHandle))
		{
			return;
		}
		foreach (Delegate item in _subscribers[typeFromHandle])
		{
			(item as Action<TMessage>)?.Invoke(message);
		}
	}
}
