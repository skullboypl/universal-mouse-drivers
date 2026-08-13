using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace OnboardMemoryManager.Helpers;

public class TaskSingleShot<T>
{
	private readonly T _default;

	private T _value;

	private readonly Func<Task<T>> _getter;

	private readonly ReaderWriterLockSlim _lock = new ReaderWriterLockSlim(LockRecursionPolicy.SupportsRecursion);

	private Task<T> _task;

	public TaskSingleShot(Func<Task<T>> getter, T value)
	{
		_getter = getter;
		_value = value;
		_default = value;
	}

	public Task<T> Get(CancellationTokenSource cancellationSource = null)
	{
		if (_task != null)
		{
			return _task;
		}
		TaskCompletionSource<T> taskCompletionSource = new TaskCompletionSource<T>();
		Action action = delegate
		{
			if (EqualityComparer<T>.Default.Equals(_value, _default))
			{
				using (new ReadLocker(_lock))
				{
					if (EqualityComparer<T>.Default.Equals(_value, _default))
					{
						_task = _getter();
						try
						{
							if (cancellationSource != null)
							{
								_task.Wait(cancellationSource.Token);
							}
							else
							{
								_task.Wait();
							}
						}
						catch (TaskCanceledException)
						{
							return;
						}
						_value = _task.Result;
					}
				}
			}
			taskCompletionSource.SetResult(_value);
		};
		if (cancellationSource != null)
		{
			Task.Factory.StartNew(action, cancellationSource.Token);
		}
		else
		{
			Task.Factory.StartNew(action);
		}
		return taskCompletionSource.Task;
	}

	public void Invalidate()
	{
		_value = _default;
	}
}
